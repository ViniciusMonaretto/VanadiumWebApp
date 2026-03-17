import { Component, OnInit } from '@angular/core';
import { UiPanelService } from "../../services/ui-panels.service"
import { MatDialog } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GatewayInfoTabComponent } from '../../components/gateway-info-tab/gateway-info-tab.component';
import { GatewayModule } from '../../models/gateway-model';
import { GatewayService } from '../../services/gateway.service';
import { AddDeviceDialogComponent } from '../../components/add-device-dialog/add-device-dialog.component';
import { DialogHelper } from '../../services/dialog-helper.service';

@Component({
    selector: 'gateway-screen',
    templateUrl: './gateway-screen.component.html',
    styleUrls: ['./gateway-screen.component.scss'],
    imports: [CommonModule, FormsModule, GatewayInfoTabComponent],
    standalone: true
})
export class GatewayScreenComponent implements OnInit {

  constructor(public dialog: MatDialog, 
    private dialogHelper: DialogHelper, 
    private gatewayService: GatewayService) {
    
  }

  // Filter properties
  nameFilter = '';
  statusFilter: 'all' | 'online' | 'offline' = 'all';
  filtersCollapsed = true;


  ngOnInit(): void {
    this.updateGateways();
  }

  getGateways(): GatewayModule[] {
    return Object.values(this.gatewayService.getGateways());
  }

  updateGateways() {
    this.gatewayService.updateGateway().then(() => {
    });
  }

  handleAddDevice() {
    this.openAddDialog();
  }

  openAddDialog() {
    this.dialog.open(AddDeviceDialogComponent, {
      data: {
        deviceId: '',
        onSubmit: (gatewayId: string) => {
          this.gatewayService.addGateway(gatewayId);
        },
      },
    });
  }

  handleDelete(gateway: GatewayModule) {
      this.dialogHelper.openQuestionDialog('Remover Dispositivo', 
        'Tem certeza que deseja remover o dispositivo ' + gateway.name + '? Esta ação não pode ser desfeita.', 
        () => {
          this.gatewayService.deleteGateway(gateway.gatewayId);
        }
    );
  }


  getFilteredGateways(): GatewayModule[] {
    return this.getGateways().filter(device => {
      // Filter by name
      const name = device?.name ?? '';
      const nameMatch = name.toLowerCase().includes(this.nameFilter.toLowerCase());
      
      // Filter by status
      const statusMatch = this.statusFilter === 'all' || device.status === this.statusFilter;
      
      return nameMatch && statusMatch;
    });
  }

  clearFilters() {
    this.nameFilter = '';
    this.statusFilter = 'all';
  }

  hasActiveFilters(): boolean {
    return this.nameFilter !== '' || this.statusFilter !== 'all';
  }

  getResultsText(): string {
    const filtered = this.getFilteredGateways();
    return `${filtered.length} dispositivo${filtered.length !== 1 ? 's' : ''}`;
  }

  toggleFilters() {
    this.filtersCollapsed = !this.filtersCollapsed;
  }
}   