import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupInfo, UiPanelService } from '../../services/ui-panels.service';
import { IoButtonComponent } from '../io-button/io-button.component';

export interface GroupManagementDialogData {
  /** Optional: if not provided, dialog uses UiPanelService.groups */
  groups?: GroupInfo[];
}

@Component({
  selector: 'app-group-management-dialog',
  templateUrl: './group-management-dialog.component.html',
  styleUrls: ['./group-management-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    IoButtonComponent,
  ],
  standalone: true,
})
export class GroupManagementDialogComponent {
  newGroupName = '';

  constructor(
    public dialogRef: MatDialogRef<GroupManagementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupManagementDialogData | null,
    private uiPanelService: UiPanelService,
  ) {}

  get groups(): GroupInfo[] {
    return this.data?.groups ?? Object.values(this.uiPanelService.groups);
  }

  closeGroupManagerDialog(): void {
    this.dialogRef.close();
  }

  createNewGroup(): void {
    const name = (this.newGroupName ?? '').trim();
    if (!name) return;
    this.uiPanelService.AddGroup({ name });
    this.newGroupName = '';
  }

  deleteGroup(id: number): void {
    this.uiPanelService.RemoveGroup(id);
  }
}
