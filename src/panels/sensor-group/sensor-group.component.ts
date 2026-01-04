import { Component, OnInit } from '@angular/core';
import { UiPanelService } from "../../services/ui-panels.service"
import { MatCardModule } from '@angular/material/card';

import { CommonModule } from '@angular/common';
import { GroupOfSensorsComponent } from '../../components/group-of-sensors/group-of-sensors.component';
import { SensorTypesEnum } from '../../enum/sensor-type';
import { SensorModule } from '../../models/sensor-module';
import { MainScreenSelector } from '../../services/main-screen-selector.service';

@Component({
  selector: 'sensor-groups',
  templateUrl: './sensor-group.component.html',
  styleUrls: ['./sensor-group.component.scss'],
  imports: [MatCardModule, CommonModule, GroupOfSensorsComponent],
  standalone: true
})
export class SensorGroupComponent implements OnInit {

  constructor(private UiPanelsService: UiPanelService,
    private mainScreenService: MainScreenSelector) { }

  ngOnInit(): void {
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
    this.UiPanelsService.setSelectSensor(null)
  }

}
