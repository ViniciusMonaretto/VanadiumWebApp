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

@Component({
  selector: 'app-manager-screen',
  templateUrl: './manager-screen.component.html',
  styleUrls: ['./manager-screen.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatSidenavModule,
    ManagedUsersComponent,
    ManagerNavbarComponent,
  ],
  standalone: true,
})
export class ManagerScreenComponent implements OnInit {

  activeOption: ManagerNavOption = 'empresas';

  constructor(
    private authService: AuthService,
    private uiPanelService: UiPanelService,
    private router: Router
  ) {}

  ngOnInit(): void {}

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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
