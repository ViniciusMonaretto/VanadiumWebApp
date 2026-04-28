import { Component, Inject, HostListener, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FlowSensorModule, SensorModule } from '../../models/sensor-module';
import { IoButtonComponent } from '../io-button/io-button.component';
import { SensorTypesEnum } from '../../enum/sensor-type';
import { AlarmLevel } from '../../enum/alarm-type';

@Component({
  selector: 'sensor-info-dialog',
  templateUrl: './sensor_info_dialog.component.html',
  styleUrls: ['./sensor_info_dialog.component.scss'],
  imports: [CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    IoButtonComponent],
  standalone: true
})
export class SensorInfoDialogComponent {

  public sensorName: string = ""
  public gain: number = 0
  public offset: number = 0
  public enableAlarms: boolean = false
  public maxAlarm: Number | null | undefined = null
  public minAlarm: Number | null | undefined = null
  public alarmLevel: string = "warning"
  public showPicker: boolean = false
  public sensorType: SensorTypesEnum = SensorTypesEnum.TEMPERATURA
  public displayedType: number = 0
  private panelId = -1
  private gateway = ""
  private topic = ""
  private indicator = 0
  color: string = ""
  
  newName: string = ""  
  kiloSelected: boolean = false

  private onApplyAction: ((obj: any) => void) | null = null

  uiConfig: { [id: string]: any } = {}
  calibrate: boolean = false

  unitOptions = [{label: 'L/min', value: 0}, 
    {label: 'L/h', value: 1}, 
    {label: 'L/dia', value: 2}, 
    {label: 'L/semana', value: 3}, 
    {label: 'L/mês', value: 4}];

  constructor(public dialogRef: MatDialogRef<SensorInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sensorInfo: SensorModule, callback: ((obj: any) => void)},
    private elementRef: ElementRef
  ) {
    this.sensorName = data.sensorInfo.name
    this.newName = this.sensorName
    this.gain = data.sensorInfo.gain ?? null
    this.offset = data.sensorInfo.offset ?? null
    this.panelId = data.sensorInfo.id
    this.maxAlarm = data.sensorInfo.maxAlarm?.threshold
    this.minAlarm = data.sensorInfo.minAlarm?.threshold

    const severity = data.sensorInfo.maxAlarm?.severity ?? data.sensorInfo.minAlarm?.severity;

    // Use != null (not truthiness): AlarmLevel.INFO is 0, which is falsy and would be skipped.
    if (severity != null) {
        switch (severity) {
          case AlarmLevel.INFO:
            this.alarmLevel = "info";
            break;
          case AlarmLevel.CRITICAL:
            this.alarmLevel = "critical";
            break;
          case AlarmLevel.WARNING:
            this.alarmLevel = "warning";
            break;
          default:
            this.alarmLevel = "warning";
            break;
        }
    }

    this.calibrate = this.gain != null && this.offset != null

    this.enableAlarms = this.maxAlarm != null || this.minAlarm != null;

    this.sensorType = data.sensorInfo.type

    this.gateway = data.sensorInfo.gatewayId
    this.indicator = data.sensorInfo.index
    this.onApplyAction = data.callback;
    this.color = data.sensorInfo.color
    this.kiloSelected = data.sensorInfo.multiplier == 1000

    if (this.sensorType === SensorTypesEnum.VAZAO) {
      this.displayedType = (data.sensorInfo as FlowSensorModule).displayedType ?? 0
    }
  }

  validForm() {
    var choosenMultiplier = this.kiloSelected ? 1000 : 1
    var validMultiplier = choosenMultiplier != this.data.sensorInfo.multiplier
    var isColorDifferent = this.color !== this.data.sensorInfo.color
    var isNameDifferent = this.newName !== this.data.sensorInfo.name
    var validCalibration = !this.calibrate ||
                           (this.gain !== null && this.offset !== null)
    return (this.calibrate || this.enableAlarms || isColorDifferent || isNameDifferent || validMultiplier) && (validCalibration)
  }

  isFlowSensor() {
    return this.sensorType === SensorTypesEnum.VAZAO
  }

  /**
   * Normalizes UI / API values to a finite number or null (empty / invalid → null).
   */
  private normalizeAlarmInput(value: Number | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * AlarmThresholdPatch JSON: undefined = omit property (unchanged);
   * null = remove all alarms on that side; number = add/replace with that threshold.
   */
  private alarmThresholdPatchIfChanged(
    current: Number | number | null | undefined,
    original: Number | number | null | undefined,
  ): number | null | undefined {
    const orig = this.normalizeAlarmInput(original);
    const curr = this.normalizeAlarmInput(current);
    if (orig === curr) {
      return undefined;
    }
    if (curr === null) {
      return null;
    }
    return curr;
  }

  getChangeInfoPanel() {
    const base = {
      name: this.newName,
      gain: this.gain,
      offset: this.offset,
      gateway: this.gateway,
      topic: this.topic,
      indicator: this.indicator,
      id: this.panelId,
      color: this.color,
      multiplier: this.kiloSelected ? 1000 : 1,
      displayedType: Number.parseInt(this.displayedType.toString()),
    } as Record<string, unknown>;

    if (!this.enableAlarms) {
      base['maxAlarm'] = null;
      base['minAlarm'] = null;
    } else {
      base['maxAlarm'] = this.maxAlarm;
      base['minAlarm'] = this.minAlarm;
      if (this.alarmLevel !== undefined) {
        switch (this.alarmLevel) {
          case "critical":
            base['alarmSeverity'] = AlarmLevel.CRITICAL;
            break;
          case "warning":
            base['alarmSeverity'] = AlarmLevel.WARNING;
            break;
          case "info":
            base['alarmSeverity'] = AlarmLevel.INFO;
            break;
        }
       }
    }

    return base;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    if (this.onApplyAction) {
      this.onApplyAction(this.getChangeInfoPanel())
    }
    this.dialogRef.close();
  }

}
