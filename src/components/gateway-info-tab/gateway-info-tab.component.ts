import { Component,  EventEmitter,  Input, Output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GatewayModule } from '../../models/gateway-model';

@Component({
  selector: 'gateway-info-tab',
  imports: [CommonModule],
  templateUrl: './gateway-info-tab.component.html',
  styleUrl: './gateway-info-tab.component.scss',
  standalone: true
})
export class GatewayInfoTabComponent {

  @Input() gateway!: GatewayModule;
  @Output() delete = new EventEmitter<GatewayModule>();

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  handleDelete() {
    this.menuOpen = false;
    this.delete.emit(this.gateway);
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'online': return 'status-online';
      case 'offline': return 'status-offline';
      case 'warning': return 'status-warning';
      default: return 'status-offline';
    }
  }

  getImageUrl(image: string): string {

    if (!image) {
      return `assets/images/device.png`;
    }
    return `assets/images/${image}.png`;
  }

  formatUptime(dateUptime: Date): string {

    if (!dateUptime) {
      return 'Offline';
    }

    dateUptime =  new Date(dateUptime);

    const uptimeMilliseconds = new Date().getTime() - dateUptime.getTime();
    if (uptimeMilliseconds <= 0) {
      return 'Offline';
    }

    // Convert milliseconds to seconds
    const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
    
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

    return parts.length > 0 ? parts.join(' ') : '0s';
  }
}
