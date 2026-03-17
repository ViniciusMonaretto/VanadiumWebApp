import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SensorModule } from '../../models/sensor-module';
import { SensorTypesEnum } from '../../enum/sensor-type';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { throwDialogContentAlreadyAttachedError } from '@angular/cdk/dialog';

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
      return scaleString + "L/min"
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

    if (!this.sensorInfo.isActive) {
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
    return this.sensorInfo && this.sensorInfo?.isActive && this.sensorInfo?.value != null ?
                    (Number(this.sensorInfo.value)/this.sensorInfo.multiplier).toFixed(2) : "--"
  }

  /**
   * Returns a label like "Ativo a menos de 1 minuto atrás" or "Ativo há N minutos".
   * Uses minute-by-minute granularity.
   */
  getLastActivityLabel(): string {
    const last = this.sensorInfo?.lastActivity;
    if (!last) return 'Ativo há muito tempo';
    const lastTime = last instanceof Date ? last.getTime() : new Date(last).getTime();
    const now = Date.now();
    const diffMs = now - lastTime;
    const diffMinutes = Math.floor(diffMs / (60 * 1000));

    if (diffMinutes < 0) return 'Ativo agora';
    if (diffMinutes === 0) return 'Ativo a menos de 1 minuto atrás';
    if (diffMinutes === 1) return 'Ativo há 1 minuto';
    if (diffMinutes < 60) return `Ativo há ${diffMinutes} minutos`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours === 1) return 'Ativo há 1 hora';
    return `Ativo há ${hours} horas`;
  }

}
