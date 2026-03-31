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

  getChangeInfoPanel() {
    return {
      "name": this.newName,
      "gain": this.gain,
      "offset": this.offset,
      "maxAlarm": this.enableAlarms ? this.maxAlarm : null,
      "minAlarm": this.enableAlarms ? this.minAlarm : null,
      "gateway": this.gateway,
      "topic": this.topic,
      "indicator": this.indicator,
      "id": this.panelId,
      "color": this.color,
      "multiplier": this.kiloSelected ? 1000 : 1,
      "displayedType": Number.parseInt(this.displayedType.toString())
    }
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
