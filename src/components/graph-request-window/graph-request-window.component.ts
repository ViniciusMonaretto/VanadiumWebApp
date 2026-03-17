import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { BrazilianDateAdapter } from '../../app/brazilian-date-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { SensorModule } from '../../models/sensor-module';
import { GroupInfo } from '../../services/ui-panels.service';
import { IoButtonComponent } from '../io-button/io-button.component';
import { DialogHelper } from '../../services/dialog-helper.service';
import { SensorTypesEnum } from '../../enum/sensor-type';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

@Component({
  selector: 'app-graph-request',
  templateUrl: './graph-request-window.component.html',
  styleUrls: ['./graph-request-window.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    IoButtonComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  standalone: true
})
export class GraphRequestWindowComponent implements OnInit {

  uiConfig: { [id: string]: GroupInfo } = {}

  selectedSensors: Set<SensorModule> = new Set()
  searchFilter = '';
  sensors: Array<SensorModule> = []
  filteredSensors: Array<SensorModule> = []
  option: string = ""

  constructor(public dialogRef: MatDialogRef<GraphRequestWindowComponent>, private dialogHelper: DialogHelper,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.uiConfig = data.uiConfig

    this.sensors = this.getAvailableSensors();
    this.filteredSensors = this.sensors;
  }

  ngOnInit(): void {
  }

  getGroups(): GroupInfo[] {
    let uiVector = []
    for (let group in this.uiConfig) {
      uiVector.push(this.uiConfig[group])
    }
    return uiVector;
  }

  getAvailableSensors() {
    var sensors = [];
    for (let group in this.uiConfig) {
      sensors.push(...this.uiConfig[group].panels)
    }
    return sensors;
  }

  validForm() {
    return this.selectedSensors.size > 0;
  }

  onSearchChange(): void {
    this.updateFilteredSensors();
  }

  private updateFilteredSensors(): void {
    const searchLower = this.searchFilter.toLowerCase();
    this.filteredSensors = this.sensors.filter(sensor =>
      sensor.name.toLowerCase().includes(searchLower)
    );
  }

  selectAll(): void {
    this.selectedSensors.clear();
    this.filteredSensors.forEach(sensor => {
      this.selectedSensors.add(sensor);
    });
  }

  trackBySensorId(_index: number, sensor: SensorModule): number {
    return sensor.id;
  }

  toggleSensor(sensor: SensorModule): void {
    if (this.selectedSensors.has(sensor)) {
      this.selectedSensors.delete(sensor);
    } else {
      this.selectedSensors.add(sensor);
    }
  }

  isSensorSelected(sensor: SensorModule): boolean {
    return this.selectedSensors.has(sensor);
  }

  deselectAll(): void {
    this.selectedSensors.clear();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onAddCLick() {
    // let obj = {
    //   "selectedSensors": this.selectedSensors,
    //   "startDate": this.startDate,
    //   "endDate": this.endDate,
    //   "group": this.selectedGroup?.id
    // }

    let obj = {
        selectedSensors: Array.from(this.selectedSensors),
      };

    this.data.callback(obj);
    this.dialogRef.close();
  }

}
