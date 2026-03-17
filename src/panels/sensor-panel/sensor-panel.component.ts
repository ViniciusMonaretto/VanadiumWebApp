import { Component, OnInit } from '@angular/core';
import { GroupInfo, UiPanelService } from "../../services/ui-panels.service"
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CommonModule } from '@angular/common';
import { SensorTypesEnum } from '../../enum/sensor-type';
import { SensorModule } from '../../models/sensor-module';
import { MainScreenSelector } from '../../services/main-screen-selector.service';
import { SensorInfoDialogComponent } from '../../components/sensor_info_dialog/sensor_info_dialog.component';
import { GroupManagementDialogComponent } from '../../components/group-management-dialog/group-management-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { WaterMeasureComponent, WaterReadingPoint } from '../../components/water-measure/water-measure.component';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SensorAddWindowComponent } from '../../components/sensor-add-window/sensor-add-window.component';
import { SensorComponent } from '../../components/sensor/sensor.component';
import { DialogHelper } from '../../services/dialog-helper.service';

@Component({
  selector: 'sensor-panel',
  templateUrl: './sensor-panel.component.html',
  styleUrls: ['./sensor-panel.component.scss'],
  imports: [MatCardModule, SensorComponent, CommonModule, MatIconModule, MatButtonModule, FormsModule],
  standalone: true
})
export class SensorPanelComponent {

  waterCurrentDailyConsumption = 0;
  waterWeeklyConsumption = 0;
  waterMonthlyConsumption = 0;
  waterLastMonthConsumption = 0;
  waterLastHourReadings: WaterReadingPoint[] = [];
  private readonly oneHourMs = 60 * 60 * 1000;

  // Filter properties
  nameFilter = '';
  typeFilter: SensorTypesEnum | null = null;
  deviceFilter = '';
  filtersCollapsed = true;

  constructor(private UiPanelsService: UiPanelService,
    private apiService: ApiService,
    private mainScreenService: MainScreenSelector,
    private router: Router,
    private dialog: MatDialog,
    private dialogHelper: DialogHelper) { }

    removeSensor(sensorId: string) {
      this.dialogHelper.openQuestionDialog("Remover sensor", "Deseja remover o sensor?", 
        () => {
          this.UiPanelsService.RemoveSensor(parseInt(sensorId));
      });
    }

  
    trackById(index: number, sensor: SensorModule) {
      return sensor.id;
    }

    getSelectedGroupSensors(): SensorModule[] {
      return this.UiPanelsService.GetSelectedGroupInfo()?.panels || [];
    }
  
    getFilteredSensors(): SensorModule[] {
      return this.getSelectedGroupSensors().filter(sensor => {
        // Filter by name
        const nameMatch = sensor.name.toLowerCase().includes(this.nameFilter.toLowerCase());
        
        // Filter by type
        const typeMatch = !this.typeFilter|| sensor.type === this.typeFilter;
        
        // Filter by device (label)
        const deviceMatch = !this.deviceFilter || sensor.gatewayId === this.deviceFilter;
        
        return nameMatch && typeMatch && deviceMatch;
      });
    }
  
    getUniqueDevices(): string[] {
      const devices = this.getSelectedGroupSensors()
        .map(s => s.gatewayId)
        .filter((label): label is string => Boolean(label));
      return [...new Set(devices)].sort();
    }
  
    clearFilters() {
      this.nameFilter = '';
      this.typeFilter = null;
      this.deviceFilter = '';
    }
  
    hasActiveFilters(): boolean {
      return this.nameFilter !== '' || this.typeFilter !== null || this.deviceFilter !== '';
    }
  
    toggleFilters() {
      this.filtersCollapsed = !this.filtersCollapsed;
    }
  
    getResultsText(): string {
      const filtered = this.getFilteredSensors();
      return `${filtered.length} sensor${filtered.length !== 1 ? 'es' : ''}`;
    }
  
    handleAddSensor(sensor: SensorModule) {
      this.UiPanelsService.AddSensor(sensor);
    }
  
    getLabelForType(type: SensorTypesEnum): string {
      switch (type) {
        case SensorTypesEnum.TEMPERATURA:
          return 'Temperatura';
        case SensorTypesEnum.UMIDADE:
          return 'Umidade';
        case SensorTypesEnum.PRESSAO:
          return 'Pressão';
        case SensorTypesEnum.VAZAO:
          return 'Vazão';
        case SensorTypesEnum.POTENCIA:
          return 'Potência';
        case SensorTypesEnum.CORRENTE:
          return 'Corrente';
        default:
          return '';
      }
    }

    plotSensor(sensorId: number) {
      this.router.navigate(['/plot', sensorId]);
    }

  
    getGroupFilteredSensors(): SensorModule[] {
      const groupSensors = this.getSelectedGroupSensors();
      return groupSensors.filter(sensor => {
        const nameMatch = sensor.name.toLowerCase().includes(this.nameFilter.toLowerCase());
        const typeMatch = !this.typeFilter || sensor.type === this.typeFilter;
        const deviceMatch = !this.deviceFilter || sensor.gatewayId === this.deviceFilter;
        return nameMatch && typeMatch && deviceMatch;
      });
    }

    openSettingsDialog(sensor: SensorModule) {
      this.dialog.open(SensorInfoDialogComponent, {
        width: '450px',
        data: {
          sensorInfo: sensor,
          callback: (sensorInfo: SensorModule) => {
            this.UiPanelsService.UpdatePanelInfo(sensorInfo);
          }
        },
      });
    }
  
    selectGroup(groupId: any) {
      if (!groupId) {
        return;
      }
      this.UiPanelsService.SelectGroup(groupId);
    }

    getSelectedGroupName(): string {
      return this.UiPanelsService.GetSelectedGroupInfo()?.name || '';
    }

    getSelectedGroupId(): string {
      return this.UiPanelsService.GetGroup() || '';
    }

    getGroups(): GroupInfo[] {
      return Object.values(this.UiPanelsService.groups);
    }

    openPageManagerDialog() {
      this.dialog.open(GroupManagementDialogComponent, {
        width: '480px',
        data: null,
      });
    }

    openAddSensorDialog()
    {
      this.dialog.open(SensorAddWindowComponent, {
        width: '450px',
        data: {
          group: this.UiPanelsService.GetSelectedGroupInfo()?.id,
          callback: (sensorData: any) => {
            this.handleAddSensor(sensorData)
          }
        }
      });
    }
}
