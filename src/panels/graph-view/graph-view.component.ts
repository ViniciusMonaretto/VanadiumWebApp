import { Component, OnDestroy, OnInit } from '@angular/core';
import { UiPanelService } from "../../services/ui-panels.service"
import { MatDialog } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { GraphRequestWindowComponent } from '../../components/graph-request-window/graph-request-window.component';
import { AdvancedChartComponent } from '../../components/advanced-chart/advanced-chart.component';
import { FaultMarker } from '../../components/graph/graph.component';
import { SensorModule } from '../../models/sensor-module';
import { EventAlarmModule } from '../../models/event-alarm-module';
import { AlarmKind } from '../../enum/alarm-type';
import { EventAlarmManagerService } from '../../services/event-alarm-manager.service';

@Component({
    selector: 'graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss'],
    imports: [CommonModule, FormsModule, MatIconModule, AdvancedChartComponent],
    standalone: true
})
export class GraphViewComponent implements OnInit, OnDestroy {

  constructor(public dialog: MatDialog,
              private uiPanelService: UiPanelService,
              private eventAlarmService: EventAlarmManagerService) {
    //this.getTable()
  }

  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  dateFromString: string = '';
  dateToString: string = '';

  lineChartData: Array<any> = [];
  clearLines: boolean = false;
  selectedSensorIds: number[] = [];
  private selectedSensors: SensorModule[] = [];

  activePreset: string = 'today';

  // Live readings: one callback per sensor on the chart, flushed to the chart in batches
  private liveSubscriptions: { sensor: SensorModule, callback: Function }[] = [];
  private pendingLivePoints: { sensor: SensorModule, x: number, y: number }[] = [];
  private liveFlushTimer: any = null;
  // Ignores responses from an older request that arrive after a newer one
  private loadId = 0;

  // IoCloud Predict faults of the sensors on the chart: a dashed line where each started
  faultMarkers: FaultMarker[] = [];
  private stopFaultListener: (() => void) | null = null;

  ngOnInit(): void 
  {
    this.setPreset(this.activePreset);
    this.stopFaultListener = this.eventAlarmService.addNewEventsListener(events => this.onLiveAlarmEvents(events));
  }

  ngOnDestroy(): void {
    this.stopLiveUpdates();
    this.stopFaultListener?.();
    this.stopFaultListener = null;
  }

  // Presets end at "now", so new readings belong on the chart; a custom period does not move
  isLive(): boolean {
    return this.activePreset !== '';
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

  private getOrCreateLine(sensor: SensorModule): any {
    let line = this.lineChartData.find(x => x.realName == sensor.name);
    if (!line) {
      line = {
        label: sensor.name,
        type: 'line',
        realName: sensor.name,
        borderColor: sensor.color,
        backgroundColor: sensor.color + '0A',
        tension: 0.3,
        fill: false,
        data: []
      };
      this.lineChartData.push(line);
    }
    return line;
  }

  private startLiveUpdates(sensors: SensorModule[]): void {
    this.stopLiveUpdates();

    for (const sensor of sensors) {
      const callback = (_topic: string, update: any) => this.onLiveReading(sensor, update);
      this.uiPanelService.addPanelSubscription(sensor, callback);
      this.liveSubscriptions.push({ sensor, callback });
    }
  }

  private stopLiveUpdates(): void {
    for (const { sensor, callback } of this.liveSubscriptions) {
      this.uiPanelService.removePanelSubscription(sensor, callback);
    }
    this.liveSubscriptions = [];
    this.pendingLivePoints = [];
    clearTimeout(this.liveFlushTimer);
    this.liveFlushTimer = null;
  }

  private onLiveReading(sensor: SensorModule, update: any): void {
    if (!this.isLive()) {
      return;
    }

    const x = new Date(update?.timestamp).getTime();
    const y = update?.value;
    if (isNaN(x) || y === null || y === undefined) {
      return;
    }

    this.pendingLivePoints.push({ sensor, x, y });

    // One gateway message carries several readings; redraw once for all of them
    if (this.liveFlushTimer === null) {
      this.liveFlushTimer = setTimeout(() => this.flushLivePoints(), 0);
    }
  }

  private flushLivePoints(): void {
    this.liveFlushTimer = null;
    const points = this.pendingLivePoints;
    this.pendingLivePoints = [];

    let changed = false;
    for (const { sensor, x, y } of points) {
      const line = this.getOrCreateLine(sensor);
      const last = line.data[line.data.length - 1];
      // Skip readings already on the chart (e.g. also returned by the history request)
      if (last && x <= last.x) {
        continue;
      }
      line.data = [...line.data, { x, y }];
      changed = true;
    }

    if (changed) {
      this.lineChartData = [...this.lineChartData];
    }
  }

  private loadFaultMarkers(sensors: SensorModule[], loadId: number): void {
    this.faultMarkers = [];
    this.eventAlarmService.getAnomalyEvents(sensors.map(s => s.id), this.dateFrom, this.dateTo)
      .then(events => {
        if (loadId !== this.loadId) {
          return;
        }
        this.faultMarkers = this.toFaultMarkers(events);
      })
      .catch(err => console.warn('Could not load IoCloud Predict faults:', err));
  }

  // A fault reported while the chart is live gets its line right away
  private onLiveAlarmEvents(events: EventAlarmModule[]): void {
    if (!this.isLive()) {
      return;
    }
    const known = new Set(this.faultMarkers.map(m => m.id));
    const added = this.toFaultMarkers(events).filter(m => !known.has(m.id));
    if (added.length > 0) {
      this.faultMarkers = [...this.faultMarkers, ...added];
    }
  }

  private toFaultMarkers(events: EventAlarmModule[]): FaultMarker[] {
    const markers: FaultMarker[] = [];
    for (const evt of events) {
      if (evt.kind !== AlarmKind.ANOMALY) {
        continue;
      }
      const sensor = this.selectedSensors.find(s => s.id === evt.panelId);
      const x = new Date(evt.timestamp as any).getTime();
      if (!sensor || isNaN(x)) {
        continue;
      }
      markers.push({ id: evt.id, x, label: `Falha · ${sensor.name}`, color: sensor.color });
    }
    return markers;
  }

  openAddWindow()
  {
    const dialogRef = this.dialog.open(GraphRequestWindowComponent, {
      width: '500px',
      data: {
        "uiConfig": this.uiPanelService.GetUiConfig(),
        selectedSensorIds: this.selectedSensorIds,
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
    this.activePreset = '';

    if (!isNaN(this.dateFrom.getTime()) && !isNaN(this.dateTo.getTime())) {
      this.reloadSelectedSensors();
    }
  }

  // Re-fetch the sensors already on the chart for the current period
  private reloadSelectedSensors(): void {
    if (this.selectedSensors.length > 0) {
      this.getTable({ selectedSensors: this.selectedSensors });
    }
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

    this.reloadSelectedSensors();
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  getTable(sensorData: {selectedSensors: SensorModule[]}): void {
    this.stopLiveUpdates();
    this.removeAllLines();
    var selectedSensors = sensorData['selectedSensors'];
    this.selectedSensors = selectedSensors;
    this.selectedSensorIds = selectedSensors.map(sensor => sensor.id);
    const loadId = ++this.loadId;
    this.loadFaultMarkers(selectedSensors, loadId);
    this.uiPanelService.sendRequestForTableInfo(selectedSensors
                                                      .map(sensor => sensor.id),
                                                 this.dateFrom,
                                                 this.dateTo)
    .then((response: { [id: string]: any[] }) => {
      if (loadId !== this.loadId) {
        return;
      }
      for (let id in response) {
        let sensor = selectedSensors.find(sensor => sensor.id.toString() == id);
        if (sensor) {
          this.onGraphUpdate(sensor, response[id]);
        }
      }
      // Subscribe only after the history is drawn so it can't overwrite live points
      this.startLiveUpdates(selectedSensors);
    })
  }

  clearGraphLines(): void {
    this.stopLiveUpdates();
    this.loadId++;
    this.removeAllLines();
    this.faultMarkers = [];
    this.selectedSensors = [];
    this.selectedSensorIds = [];
  }

}
