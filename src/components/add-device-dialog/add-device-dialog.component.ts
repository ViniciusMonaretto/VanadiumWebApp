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
    MatDialogModule],
  templateUrl: './add-device-dialog.component.html',
  styleUrl: './add-device-dialog.component.css'
})
export class AddDeviceDialogComponent {

  groups: GroupInfo[] = [];
  newGroupName = '';

  constructor(public dialogRef: MatDialogRef<AddDeviceDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: { groups: GroupInfo[], 
      onSubmit: (deviceId: any) => void }) {
    this.groups = data.groups;
  }

  deviceId = '';

  submit() {
    if (!this.deviceId.trim()) {
      return;
    }

    this.data.onSubmit(this.deviceId.trim());
    this.close();
  }

  close() {
    this.dialogRef.close();
  }
}
