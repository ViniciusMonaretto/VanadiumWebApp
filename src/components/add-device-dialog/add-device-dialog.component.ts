import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IoButtonComponent } from '../io-button/io-button.component';
import { GroupInfo } from '../../services/ui-panels.service';

interface NewDeviceInput {
  deviceId: string;
}

@Component({
  selector: 'app-add-device-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule,
    FormsModule,
    MatDialogModule,
    IoButtonComponent],
  templateUrl: './add-device-dialog.component.html',
  styleUrl: './add-device-dialog.component.css'
})
export class AddDeviceDialogComponent {

  groups: GroupInfo[] = [];
  newGroupName = '';

  constructor(public dialogRef: MatDialogRef<AddDeviceDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: { groups: GroupInfo[], 
      onSubmit: (deviceId: string) => void,
      onDelete: (groupId: number) => void,
      onClose: () => void }) {
    this.groups = data.groups;
  }

  createNewPage() {
    this.data.onSubmit(this.newGroupName);
    this.dialogRef.close();
  }

  deletePage(groupId: number) {
    this.data.onDelete(groupId);
    this.dialogRef.close();
  }

  close() {
    this.data.onClose?.();
    this.dialogRef.close();
  }
}
