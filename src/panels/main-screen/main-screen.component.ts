import { Component, OnInit } from '@angular/core';
import {MainScreenSelector} from "../../services/main-screen-selector.service"
import {MainScreenOptions} from "../../enum/screen-type"

import { CommonModule } from '@angular/common';

import { GraphViewComponent } from '../graph-view/graph-view.component';
import { SensorGroupComponent } from '../sensor-group/sensor-group.component';
import { AlarmViewComponent } from '../alarm-screen/alarm-screen.component';
import { EventAlarmManagerService } from '../../services/event-alarm-manager.service';
import { GatewayScreenComponent } from '../gateway-screen/gateway-screen.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
    selector: 'app-main-screen',
    templateUrl: './main-screen.component.html',
    styleUrls: ['./main-screen.component.scss'],
    imports: [CommonModule, GraphViewComponent, NavbarComponent, MatSidenavModule, SensorGroupComponent, AlarmViewComponent, GatewayScreenComponent],
    standalone: true
})
export class MainScreenComponent implements OnInit {

  constructor(private mainScreenSelectorServce: MainScreenSelector, 
    private alarmService: EventAlarmManagerService) { }

  ngOnInit(): void {
  }

  isSensorSelected()
  {
    return this.mainScreenSelectorServce.GetScreen() === MainScreenOptions.SENSORS
  }

  isStatusLogSelected()
  {
    return this.mainScreenSelectorServce.GetScreen() === MainScreenOptions.STATUS_LOG
  }

  isStatusAlertSelected()
  {
    return this.mainScreenSelectorServce.GetScreen() === MainScreenOptions.ALERT_VIEW
  }

  isGatewaySelected()
  {
    return this.mainScreenSelectorServce.GetScreen() === MainScreenOptions.GATEWAY_VIEW
  }

}
