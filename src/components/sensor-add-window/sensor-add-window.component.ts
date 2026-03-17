import { Component, Inject, ElementRef } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog';
import {SensorTypesEnum} from "../../enum/sensor-type"
import {SensorModule} from "../../models/sensor-module"
import { GatewayModule } from '../../models/gateway-model';

import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { ColorChromeModule } from 'ngx-color/chrome';
import { IoButtonComponent } from '../io-button/io-button.component';
import { UiPanelService } from '../../services/ui-panels.service';
import { GatewayService } from '../../services/gateway.service';


@Component({
    selector: 'app-sensor-add-window',
    templateUrl: './sensor-add-window.component.html',
    styleUrls: ['./sensor-add-window.component.scss'],
    imports: [CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        FormsModule,
        MatDatepickerModule,
        MatDialogModule,
        ColorChromeModule,
        IoButtonComponent],
    standalone: true
})
export class SensorAddWindowComponent {
  public sensorModule: SensorModule = new SensorModule()

  public sensorTypes = Object.keys(SensorTypesEnum)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      name: key,
      value: SensorTypesEnum[key as keyof typeof SensorTypesEnum]
    }));

  /** Cached list for template; set once to avoid calling Object.values() on every change detection. */
  groupOptions: GatewayModule[] = [];

  settedType?: SensorTypesEnum
  group: string = ""

  constructor(public dialogRef: MatDialogRef<SensorAddWindowComponent>,
    private gatewayService: GatewayService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private elementRef: ElementRef
  ) {
    this.settedType = data.sensorType
    this.group = data.group
    this.groupOptions = Object.values(this.gatewayService.gateways);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getSensorData()
  {
    if(this.settedType != undefined)
      this.sensorModule.type = this.settedType
    return {
      "name": this.sensorModule.name,
      "gatewayId": this.sensorModule.gatewayId,
      "type": this.sensorModule.type,
      "groupId": this.group,
      "index": this.sensorModule.index.toString(),
      "color": this.sensorModule.color
    }
  }

  validForm()
  {
    return this.sensorModule.name != "" &&
           this.sensorModule.gatewayId != "" &&
           this.sensorModule.index >= 0 
  }

  onAddCLick(): void{
    this.data.callback(this.getSensorData())
    this.dialogRef.close();
  }

}
