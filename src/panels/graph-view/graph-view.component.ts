import { Component, OnInit } from '@angular/core';
import { UiPanelService } from "../../services/ui-panels.service"
import { MatDialog } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { GraphRequestWindowComponent } from '../../components/graph-request-window/graph-request-window.component';
import { AdvancedChartComponent } from '../../components/advanced-chart/advanced-chart.component';
import { SensorModule } from '../../models/sensor-module';

@Component({
    selector: 'graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss'],
    imports: [CommonModule, FormsModule, MatIconModule, AdvancedChartComponent],
    standalone: true
})
export class GraphViewComponent implements OnInit {

  constructor(public dialog: MatDialog, private uiPanelService: UiPanelService) {
    //this.getTable()
  }

  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  dateFromString: string = '';
  dateToString: string = '';

  lineChartData: Array<any> = [];
  clearLines: boolean = false;
  selectedSensorIds: number[] = [];

  activePreset: string = 'today';

  ngOnInit(): void 
  {
    this.setPreset(this.activePreset);
  }

  onGraphUpdate(sensor: SensorModule, infoArr: Array<any>) {
    let chartId = this.lineChartData.findIndex(x => x.realName == sensor.name);

    if (chartId == -1) {
      this.lineChartData.push({
        label: sensor.name,
        type: 'line',
        realName: sensor.name,
        borderColor: sensor.color,
        backgroundColor: sensor.color + '0A',
        tension: 0.3,
        fill: false,
        data: []
      });
      chartId = this.lineChartData.length - 1;
    }

    let newSeries: { x: number, y: number }[] = [];

    for (let info of infoArr) {
      let timestamp = info['readingTime'];
      if (timestamp && !isNaN(new Date(timestamp).getTime())) {
        let dt = new Date(timestamp);
        newSeries.push({ x: dt.getTime(), y: info["value"] });
      } else {
        console.error('Invalid timestamp:', timestamp); // Debugging
      }
    }

    // Update chart data and trigger Angular change detection
    this.lineChartData[chartId].data = newSeries.sort((a, b) => a.x - b.x);

    this.lineChartData = [...this.lineChartData ]
  };

  openAddWindow()
  {
    const dialogRef = this.dialog.open(GraphRequestWindowComponent, {
      width: '500px',
      data: {
        "uiConfig": this.uiPanelService.GetUiConfig(),
        callback: (sensorData: any)=>{
          this.getTable(sensorData)
        }
      }
    });
  }

  removeAllLines()
  {
    this.lineChartData = []
  }

  onDateFilterChange()
  {
    this.dateTo = new Date(this.dateToString);
    this.dateFrom = new Date(this.dateFromString);
  }

  setPreset(preset: string): void {
    this.activePreset = preset;
    const now = new Date();
    let from: Date;

    switch (preset) {
      case '1h':
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    this.dateFrom = from;
    this.dateTo = now;

    this.dateFromString = this.toLocalDateTimeString(from);
    this.dateToString = this.toLocalDateTimeString(now);
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  getTable(sensorData: {selectedSensors: SensorModule[]}): void {
    this.removeAllLines();
    var selectedSensors = sensorData['selectedSensors'];
    this.uiPanelService.sendRequestForTableInfo(selectedSensors
                                                      .map(sensor => sensor.id),
                                                 this.dateFrom,
                                                 this.dateTo)
    .then((response: { [id: string]: any[] }) => {
      for (let id in response) {
        let sensor = selectedSensors.find(sensor => sensor.id.toString() == id);
        if (sensor) {
          this.onGraphUpdate(sensor, response[id]);
        }
      }
    })
  }

}
