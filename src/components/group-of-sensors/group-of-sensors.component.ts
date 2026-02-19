import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { SensorModule } from "../../models/sensor-module"
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {SensorAddWindowComponent} from '../../components/sensor-add-window/sensor-add-window.component'

import { CommonModule } from '@angular/common';
import { SensorComponent } from '../sensor/sensor.component';

import {UiPanelService} from "../../services/ui-panels.service"
import { MatIconModule } from '@angular/material/icon';
import { SensorInfoDialogComponent } from '../sensor_info_dialog/sensor_info_dialog.component';
import { IoButtonComponent } from '../io-button/io-button.component';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
    selector: 'group-of-sensors',
    templateUrl: './group-of-sensors.component.html',
    styleUrls: ['./group-of-sensors.component.scss'],
    imports: [CommonModule, SensorComponent, MatIconModule, IoButtonComponent],
    standalone: true
})
export class GroupOfSensorsComponent implements OnInit {

  @Input() canEdit: boolean = false;
  @Input() name: string = "";
  @Input() group: number = 0;
  @Input() sensorArray: Array<SensorModule> = [];
  @Input() width: string | undefined;
  @Output() selectSensor: EventEmitter<SensorModule> = new EventEmitter<SensorModule>();

  private spinnerDialogRef: MatDialogRef<SpinnerComponent> | null = null;

  constructor(public dialog: MatDialog, private uiPanelService: UiPanelService) { }

  ngOnInit(): void {}

  getStyleOfCell() {
    return this.width ? { width: this.width } : {};
  }

  getGridStyle() {
    const width = this.width || '380px';
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${width}, 1fr))`,
      gap: '10px',
      paddingBottom: '10px'
    };
  }

  addSensor(groupId: number): void {
    const dialogRef = this.dialog.open(SensorAddWindowComponent, {
      width: '450px',
      data: {callback: (sensorData: any)=>{
        sensorData["group"] = groupId
        this.addNewSensorCallback(sensorData)
      }
    }
    });
  }

  addNewSensorCallback(sensorData: any): void {
    console.log('Sensor added:', sensorData);
    this.uiPanelService.AddSensor(sensorData)
  }

  removeSensorCallback(sensorData: any): void {
    console.log('Sensor removed:', sensorData);
    this.uiPanelService.RemoveSensor(sensorData)
  }

  selectSensorCallback(sensorInfo: SensorModule)
  {
    this.selectSensor.emit(sensorInfo)
  }
}
