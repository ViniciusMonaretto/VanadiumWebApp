import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';


export interface NavItem {
  name: string;
  path?: string;
  action?: Function;
  icon: any;
}


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})

export class SidebarComponent {

  @Input() navItems: NavItem[] = [];

  handleAction(item: NavItem) {
    item.action?.();
  }
}
