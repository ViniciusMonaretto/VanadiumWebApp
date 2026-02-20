import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Enterprise } from '../../models/enterprise';
import { AuthService } from '../../services/auth.service';
import { UiPanelService } from '../../services/ui-panels.service';
import { ManagedUsersComponent } from '../managed-users/managed-users.component';
import { ManagerNavbarComponent, ManagerNavOption } from '../manager-navbar/manager-navbar.component';
import { NavItem, SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

import {
  LayoutDashboard,
  Users,
  LogOut
} from 'lucide-angular';

@Component({
  selector: 'app-manager-screen',
  templateUrl: './manager-screen.component.html',
  styleUrls: ['./manager-screen.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatSidenavModule,
    ManagedUsersComponent,
    SidebarComponent,
    TopbarComponent,
  ],
  standalone: true,
})
export class ManagerScreenComponent implements OnInit {

  navItems: NavItem[] = [
    { name: 'Empresas',action: () => this.onOptionChange('empresas'), icon: LayoutDashboard },
    { name: 'Usuários', action: () => this.onOptionChange('usuarios'), icon: Users },
    { name: 'Sair', action: () => this.logout(), icon: LogOut },
  ];
  
  activeOption: ManagerNavOption = 'empresas';
  date: string = '';
  location: string = '';
  company: string = '';

  constructor(
    private authService: AuthService,
    private uiPanelService: UiPanelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activeOption = `empresas`;
    this.date = new Date().toLocaleDateString();
    this.location = 'Porto Alegre';
    this.company = 'IoCloud';
  }

  onOptionChange(option: ManagerNavOption): void {
    this.activeOption = option;
  }

  hasEnterpriseSelected(): boolean {
    return this.uiPanelService.getSelectedEnterprise() !== null;
  }

  goToMain(): void {
    this.router.navigate(['/main']);
  }

  setEnterprise(enterprise: Enterprise): void {
    this.uiPanelService.RequestSelectedEnterpriseGroups(enterprise)?.then((success: boolean) => {
      if (success) {
        this.uiPanelService.setSelectedEnterprise(enterprise);
        this.router.navigate(['/main']);
      }
    });
  }

  getEnterprises(): Enterprise[] {
    return this.authService.getEnterprises();
  }

  logout(): void {
    this.uiPanelService.setSelectedEnterprise(null);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
