import { Component, OnInit } from '@angular/core';
import {MainScreenSelector} from "../../services/main-screen-selector.service"
import {MainScreenOptions} from "../../enum/screen-type"

import { CommonModule } from '@angular/common';
import {
  LayoutDashboard,
  Cpu,
  LineChart,
  History,
  LogOut
} from 'lucide-angular';

import { GraphViewComponent } from '../graph-view/graph-view.component';
import { SensorPanelComponent } from '../sensor-panel/sensor-panel.component';
import { AlarmViewComponent } from '../alarm-screen/alarm-screen.component';
import { EventAlarmManagerService } from '../../services/event-alarm-manager.service';
import { GatewayScreenComponent } from '../gateway-screen/gateway-screen.component';
import { ManagedUsersComponent } from '../managed-users/managed-users.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { UiPanelService } from '../../services/ui-panels.service';
import { AuthService } from '../../services/auth.service';
import { NavItem, SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
    selector: 'app-main-screen',
    templateUrl: './main-screen.component.html',
    styleUrls: ['./main-screen.component.scss'],
    imports: [CommonModule, GraphViewComponent, MatSidenavModule, SensorPanelComponent, AlarmViewComponent, GatewayScreenComponent, ManagedUsersComponent, SidebarComponent, TopbarComponent],
    standalone: true
})
export class MainScreenComponent implements OnInit {

  navItems: NavItem[] = [
    { name: 'Monitor',action: () => this.setSensor(""), icon: LayoutDashboard },
    { name: 'Gráficos', action: () => this.setStatusLog(), icon: LineChart },
    { name: 'Dispositivos', action: () => this.setGatewayScreen(), icon: Cpu },
    { name: 'Alarmes', action: () => this.setAlertScreen(), icon: History },
    //{ name: 'Selecionar outra empresa', action: () => this.disselectEnterprise(), icon: History },
    { name: 'Sair', action: () => this.logout(), icon: LogOut },
  ];

  public date: string = '';
  public location: string = '';
  public company: string = '';

  constructor(private mainScreenSelectorServce: MainScreenSelector, 
    private authService: AuthService,
    private UiPanelsService: UiPanelService,
    private alarmService: EventAlarmManagerService,
    private router: Router) { }

  ngOnInit(): void {
    this.date = new Date().toLocaleDateString();
    this.location = 'Porto Alegre';
    this.company = 'IoCloud';
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

  isManagedUsersSelected(): boolean {
    return this.mainScreenSelectorServce.GetScreen() === MainScreenOptions.MANAGED_USERS;
  }

  setSensor(group: string) {
    this.mainScreenSelectorServce.SelectScreen(MainScreenOptions.SENSORS, group)
  }

  setStatusLog() {
    this.mainScreenSelectorServce.SelectScreen(MainScreenOptions.STATUS_LOG, null)
  }

  setAlertScreen() {
    this.mainScreenSelectorServce.SelectScreen(MainScreenOptions.ALERT_VIEW, null)
  }

  setGatewayScreen() {
    this.mainScreenSelectorServce.SelectScreen(MainScreenOptions.GATEWAY_VIEW, null)
  }

  logout(): void {
    this.UiPanelsService.setSelectedEnterprise(null);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  disselectEnterprise(): void {
    this.UiPanelsService.setSelectedEnterprise(null);
    this.router.navigate(['/manager']);
  }

}
