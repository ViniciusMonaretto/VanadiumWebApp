import { Component, OnInit } from '@angular/core';
import { UiPanelService } from "../../services/ui-panels.service"
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CommonModule } from '@angular/common';
import { GroupOfSensorsComponent } from '../../components/group-of-sensors/group-of-sensors.component';
import { SensorTypesEnum } from '../../enum/sensor-type';
import { SensorModule } from '../../models/sensor-module';
import { MainScreenSelector } from '../../services/main-screen-selector.service';
import { SensorInfoDialogComponent } from '../../components/sensor_info_dialog/sensor_info_dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { WaterMeasureComponent, WaterReadingPoint } from '../../components/water-measure/water-measure.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'sensor-panel',
  templateUrl: './sensor-panel.component.html',
  styleUrls: ['./sensor-panel.component.scss'],
  imports: [MatCardModule, CommonModule, MatIconModule, MatButtonModule, GroupOfSensorsComponent, WaterMeasureComponent],
  standalone: true
})
export class SensorPanelComponent implements OnInit {

  waterCurrentDailyConsumption = 0;
  waterWeeklyConsumption = 0;
  waterMonthlyConsumption = 0;
  waterLastMonthConsumption = 0;
  waterLastHourReadings: WaterReadingPoint[] = [];
  private readonly oneHourMs = 60 * 60 * 1000;

  constructor(private UiPanelsService: UiPanelService,
    private apiService: ApiService,
    private mainScreenService: MainScreenSelector,
    private dialog: MatDialog) { }

  ngOnInit(): void 
  {
    this.UiPanelsService.setSelectSensor(null)
  }

  getInfoOfGroup() {
    let info = this.UiPanelsService.GetSelectedGroupInfo()
    if (!info) {
      return []
    }
    return info.panels
  }

  getGroupSelected() {
    return this.UiPanelsService.GetSelectedGroupInfo()?.id
  }

  getGroupName(){
    const groupInfo = this.UiPanelsService.GetSelectedGroupInfo()
    return groupInfo ? groupInfo.name : ''
  }

  getSensorType() {
    return SensorTypesEnum
  }

  getGroupSensorUi() {
    let info = Object.keys(this.UiPanelsService.GetUiConfig())
    return info
  }

  getSensorSelected(): SensorModule | null {
    return this.UiPanelsService.GetSelectedSensor()
  }

  CanEdit() {
    return this.mainScreenService.CanEdit();
  }

  diselectSensor() {
    var selectedSensor = this.getSensorSelected();
    if(selectedSensor) {
      this.UiPanelsService.setSelectSensor(null)
      this.UiPanelsService.removePanelSubscription(selectedSensor, 1);
    }
  }

  selectSensor(sensor: SensorModule) {
    this.UiPanelsService.setSelectSensor(sensor);
    this.UiPanelsService.addPanelSubscription(sensor, (name: string, reading: any) => {
      this.updatePanelReading(reading.value);
    });
    this.resetWaterMeasureState();
  }

  private updatePanelReading(value: any)
  {
    this.waterCurrentDailyConsumption += value;
    this.waterWeeklyConsumption += value;
    this.waterMonthlyConsumption += value;
  }

  private resetWaterMeasureState(): void {
    this.waterCurrentDailyConsumption = 0;
    this.waterWeeklyConsumption = 0;
    this.waterMonthlyConsumption = 0;
    this.waterLastMonthConsumption = 0;
    this.waterLastHourReadings = [];
  }

  onSelectSensor(sensor: SensorModule) {
    if (sensor.type === SensorTypesEnum.VAZAO) 
    {
      this.apiService.send("GetPanelFlowConsumption", sensor.id, "Buscando dados do sensor"	).then((response: any) => {
        this.selectSensor(sensor);
        this.waterCurrentDailyConsumption = response.dayConsumption;
        this.waterWeeklyConsumption = response.weekConsumption;
        this.waterMonthlyConsumption = response.monthConsumption;
        this.waterLastMonthConsumption = response.lastMonthConsumption;

        let newSeries: WaterReadingPoint[] = [];

        for (let info of response.readingsLastHour) {
          let timestamp = info['readingTime'];
          if (timestamp && !isNaN(new Date(timestamp).getTime())) {
            let dt = new Date(timestamp);
            newSeries.push({ x: dt.getTime(), y: info["value"] });
          } else {
            console.error('Invalid timestamp:', timestamp); // Debugging
          }
        }

        this.waterLastHourReadings = newSeries;
      })
    }
    else
    {
      this.openSensorDialog(sensor)
    }
  }

  openSensorDialog(sensorInfo: SensorModule)
  {
    const dialogRef = this.dialog.open(SensorInfoDialogComponent, {
      width: '450px',
      data: {sensorInfo: sensorInfo,
      sensorType: sensorInfo.type,
      canEdit: this.CanEdit(),
      callback: (calibrateInfo: any) => {
        this.UiPanelsService.UpdatePanelInfo(calibrateInfo)
      }
    }
    });
  }

}
