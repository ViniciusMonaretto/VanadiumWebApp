import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { IoButtonComponent } from '../io-button/io-button.component';
import { CreateManagedUserDto } from '../../models/user';
import { ManagedUsersService } from '../../services/managed-users.service';

@Component({
    selector: 'app-managed-user-add-window',
    templateUrl: './managed-user-add-window.component.html',
    styleUrls: ['./managed-user-add-window.component.scss'],
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatDialogModule,
        IoButtonComponent
    ],
    standalone: true
})
export class ManagedUserAddWindowComponent {

    name = '';
    username = '';
    email = '';
    company: string | null = null;
    password = '';
    submitting = false;

    constructor(
        public dialogRef: MatDialogRef<ManagedUserAddWindowComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { onSuccess?: () => void },
        private managedUsersService: ManagedUsersService
    ) {}

    validForm(): boolean {
        return !!(
            this.name?.trim() &&
            this.username?.trim() &&
            this.email?.trim() &&
            this.password
        );
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }

    onAddClick(): void {
        if (!this.validForm() || this.submitting) return;
        const dto: CreateManagedUserDto = {
            name: this.name.trim(),
            username: this.username.trim(),
            email: this.email.trim(),
            password: this.password,
            ...(this.company?.trim() ? { company: this.company.trim() } : {})
        };
        this.submitting = true;
        this.managedUsersService.createManagedUser(dto)
            .then(() => {
                this.data.onSuccess?.();
                this.dialogRef.close(true);
            })
            .finally(() => {
                this.submitting = false;
            });
    }
}
