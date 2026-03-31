import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FlowSensorModule, SensorModule } from '../../models/sensor-module';
import { SensorTypesEnum } from '../../enum/sensor-type';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { throwDialogContentAlreadyAttachedError } from '@angular/cdk/dialog';
import { getLastActivityLabel } from '../../utils/date-util';

@Component({
  selector: 'sensor',
  templateUrl: './sensor.component.html',
  styleUrls: ['./sensor.component.scss'],
  imports: [CommonModule, MatIconModule],
  standalone: true
})
export class SensorComponent implements OnInit {
  @Input() canEdit: boolean = false
  @Input() sensorInfo: SensorModule = new SensorModule()
  @Output() settings = new EventEmitter<SensorModule>();
  @Output() plot = new EventEmitter<SensorModule>();
  @Output() deleteCallback: EventEmitter<any> = new EventEmitter();

  public sensorTypes = Object.values(SensorTypesEnum);
  public menuOpen = false;

  constructor() { }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  getMeasureIcon(): String {
    let scaleString = ""
    if (this.sensorInfo.multiplier == 10) {
      scaleString = "d";
    }
    if (this.sensorInfo.multiplier == 100) {
      scaleString = "c";
    }
    if (this.sensorInfo.multiplier == 1000) {
      scaleString = "k";
    }

    if (this.sensorInfo.type == SensorTypesEnum.PRESSAO) {
      return scaleString + "Pa"
    }
    if (this.sensorInfo.type == SensorTypesEnum.TEMPERATURA) {
      return scaleString + "ºC"
    }
    if (this.sensorInfo.type == SensorTypesEnum.VAZAO) {

      var flowSensor = this.sensorInfo as FlowSensorModule
      switch (flowSensor.displayedType) {
        case 0:
          return scaleString + "L/min"
        case 1:
          return scaleString + "L/dia"
        case 2:
          return scaleString + "L/semana"
        case 3:
          return scaleString + "L/mês"
        default:
          return scaleString + "L/min"
      }
    }
    if (this.sensorInfo.type == SensorTypesEnum.POTENCIA) {
      return scaleString + "W"
    }
    if (this.sensorInfo.type == SensorTypesEnum.CORRENTE) {
      return scaleString + "A"
    }
    if (this.sensorInfo.type == SensorTypesEnum.TENSÃO) {
      return scaleString + "V"
    }
    if (this.sensorInfo.type == SensorTypesEnum.FATOR_DE_POTENCIA) {
      return scaleString + "%"
    }

    return ""
  }

  ngOnInit(): void {
    this.sensorInfo.name
  }

  getStatusMessageOfSensor() {
    var value = this.sensorInfo?.value
    var maxValue = this.sensorInfo?.maxAlarm?.threshold
    var minValue = this.sensorInfo?.minAlarm?.threshold

    if (!this.sensorInfo.active) {
      return 'offline';
    }

    if (!value && value !== 0) {
      return 'offline';
    }

    if (maxValue && value > maxValue) {
      return 'warning'
    }

    if (minValue && value < minValue) {
      return 'warning'
    }

    return 'online';
  }

  getStatusColor(): string {
    switch (this.getStatusMessageOfSensor()) {
      case 'online':
        return 'status-online';
      case 'offline':
        return 'status-offline';
      case 'warning':
        return 'status-warning';
      default:
        return '';
    }
  }

  deletePanel() {
    this.deleteCallback.emit(this.sensorInfo.id)
  }

  plotSensor() {
    this.plot.emit(this.sensorInfo)
  }

  openSettingsDialog() {
    this.settings.emit(this.sensorInfo)
  }

  getCurrentReading() {
    if (!this.sensorInfo || !this.sensorInfo.active || this.sensorInfo.value == null) {
      return "--"
    }

    if (this.sensorInfo.type === SensorTypesEnum.VAZAO) {

      var flowSensor = this.sensorInfo as FlowSensorModule
      switch (flowSensor.displayedType) {
        case 0:
          return (Number(this.sensorInfo.value)/this.sensorInfo.multiplier).toFixed(2)
        case 1:
          return flowSensor.flowConsumption.dayConsumption.toFixed(2)
        case 2:
          return flowSensor.flowConsumption.weekConsumption.toFixed(2)
        case 3:
          return flowSensor.flowConsumption.monthConsumption.toFixed(2)
        default:
          return (Number(this.sensorInfo.value)/this.sensorInfo.multiplier).toFixed(2)
      }
      return (Number(this.sensorInfo.value)/this.sensorInfo.multiplier).toFixed(2)
    }

    return (Number(this.sensorInfo.value)/this.sensorInfo.multiplier).toFixed(2)
  }

  getLastActivityLabel(): string{
    return getLastActivityLabel(this.sensorInfo.lastActivity);
  }

}
