import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { IoCloudTableComponent } from '../../components/io-cloud-table/io-cloud-table.component';
import { MatDialog } from '@angular/material/dialog';
import { UiPanelService } from '../../services/ui-panels.service';
import { EventAlarmManagerService } from '../../services/event-alarm-manager.service';
import { DialogHelper } from '../../services/dialog-helper.service';
import { IoButtonComponent } from '../../components/io-button/io-button.component';
import { EventAlarmModule } from '../../models/event-alarm-module';
import { AlarmLevel } from '../../enum/alarm-type';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'event-screen',
    templateUrl: './alarm-screen.component.html',
    styleUrls: ['./alarm-screen.component.scss'],
    imports: [CommonModule, 
              MatIconModule, 
              MatCardModule,
              FormsModule],
    standalone: true
})
export class AlarmViewComponent implements OnInit {
  headerInfo: string[][] = [["panelName", "Sensor"], ["panelType", "Tipo"], ["value", "Valor"], ["timestamp", "Data"]]
  filtersCollapsed: boolean = true
  nameFilter = '';
  typeFilter: 'all' | 'critical' | 'warning' | 'info' = 'all';
  constructor(private dialogHelper: DialogHelper, 
    private eventsService: EventAlarmManagerService,
    private uiPanelService: UiPanelService)
  {

  }

  getTypeLabel(level: AlarmLevel): string {
    switch (level) {
      case AlarmLevel.CRITICAL:
        return 'Crítico';
      case AlarmLevel.WARNING:
        return 'Alerta';
      case AlarmLevel.INFO:
        return 'Info';
    }
  }

  getAlarmLevelFromAlarmString()
  {
    switch (this.typeFilter) {
      case 'critical':
        return AlarmLevel.CRITICAL
      case 'warning':
        return AlarmLevel.WARNING
      case 'info':
        return AlarmLevel.INFO
    }
    return AlarmLevel.WARNING
  }

  isLevelCritical(level: AlarmLevel): boolean {
    return level === AlarmLevel.CRITICAL
  }

  isLevelWarning(level: AlarmLevel): boolean {
    return level === AlarmLevel.WARNING
  }

  isLevelInfo(level: AlarmLevel): boolean {
    return level === AlarmLevel.INFO
  }

  eraseAllEvents()
  {
    this.dialogHelper.openQuestionDialog("Apagar eventos", 
      "Deseja limpar todos os eventos?",
      () =>
      {
        this.eventsService.removeAllEvents()
      })
  }

  ngOnInit(): void {

  }
  
  toggleFilters() {
    this.filtersCollapsed = !this.filtersCollapsed;
  }

  hasActiveFilters(): boolean {
    return this.nameFilter !== '' || this.typeFilter !== 'all';
  }

  clearFilters() {
    this.nameFilter = '';
    this.typeFilter = 'all';
  }

  getFilteredAlarms(): EventAlarmModule[] {
    var events =  this.getAlarmsEvents().filter(event => event.name.toLowerCase()
    .includes(this.nameFilter.toLowerCase()) && 
    (this.typeFilter === 'all' || event.level === this.getAlarmLevelFromAlarmString()));

    return events
  }

  getEvents() {
    return this.eventsService.getEvents()
  }

  getAlarmsEvents(): EventAlarmModule[] {
    return this.eventsService.getEvents()
  }

  getCriticalCount(): number {
    return this.getAlarmsEvents().filter(event => event.level === AlarmLevel.CRITICAL).length
  }

  getWarningCount(): number {
    return this.getAlarmsEvents().filter(event => event.level === AlarmLevel.WARNING).length
  }

  getActiveCount() {
    var count = 0
    for (let group of Object.values(this.uiPanelService.GetUiConfig())) {
      for (let panel of group.panels) {
        if (panel.maxAlarm?.threshold && panel.value && panel.maxAlarm?.threshold <= panel.value) {
          count++
        }
        if (panel.minAlarm?.threshold && panel.value && panel.minAlarm?.threshold >= panel.value) {
          count++
        }
      }
    }
    return count
  }

  
  formatTime(dateStr: Date|null): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHr < 24) return `${diffHr}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
