import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SideNavOptionComponent } from '../../components/side-nav-option/side-nav-option.component';
import { AuthService } from '../../services/auth.service';
import { UiPanelService } from '../../services/ui-panels.service';

export type ManagerNavOption = 'empresas' | 'usuarios';

@Component({
  selector: 'app-manager-navbar',
  templateUrl: './manager-navbar.component.html',
  styleUrls: ['./manager-navbar.component.scss'],
  imports: [CommonModule, SideNavOptionComponent],
  standalone: true,
})
export class ManagerNavbarComponent {

  @Input() activeOption: ManagerNavOption = 'empresas';

  @Output() optionChange = new EventEmitter<ManagerNavOption>();

  constructor(
    private authService: AuthService,
    private uiPanelService: UiPanelService,
    private router: Router
  ) {}

  hasEnterpriseSelected(): boolean {
    return this.uiPanelService.getSelectedEnterprise() !== null;
  }

  isEmpresasSelected(): boolean {
    return this.activeOption === 'empresas';
  }

  isUsuariosSelected(): boolean {
    return this.activeOption === 'usuarios';
  }

  selectEmpresas(): void {
    this.optionChange.emit('empresas');
  }

  selectUsuarios(): void {
    this.optionChange.emit('usuarios');
  }

  goToMain(): void {
    this.router.navigate(['/main']);
  }

  isUserManager(): boolean {
    return this.authService.isUserManager();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
