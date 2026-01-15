import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Enterprise } from '../../models/enterprise';
import { AuthService } from '../../services/auth.service';
import { UiPanelService } from '../../services/ui-panels.service';
import { DialogHelper } from '../../services/dialog-helper.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'enterprise-selection',
  templateUrl: './enterprise-selection.component.html',
  styleUrls: ['./enterprise-selection.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    NavbarComponent,
    MatSidenavModule
  ],
  standalone: true
})
export class EnterpriseSelectionComponent implements OnInit {

  constructor(private authService: AuthService,
    private uiPanelService: UiPanelService,
    private dialogHelper: DialogHelper,
    private router: Router) { }

  ngOnInit(): void {
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
}
