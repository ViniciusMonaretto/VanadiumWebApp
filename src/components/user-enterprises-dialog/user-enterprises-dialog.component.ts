import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IoButtonComponent } from '../io-button/io-button.component';
import { User } from '../../models/user';
import { Enterprise } from '../../models/enterprise';
import { ManagedUsersService } from '../../services/managed-users.service';

export interface UserEnterprisesDialogData {
    user: User;
    managerEnterprises: Enterprise[];
    onSuccess?: () => void;
}

@Component({
    selector: 'app-user-enterprises-dialog',
    templateUrl: './user-enterprises-dialog.component.html',
    styleUrls: ['./user-enterprises-dialog.component.scss'],
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        IoButtonComponent
    ],
    standalone: true
})
export class UserEnterprisesDialogComponent implements OnInit {

    assignedEnterprises: Enterprise[] = [];
    availableEnterprises: Enterprise[] = [];
    loading = true;
    actionInProgress: { enterpriseId: number } | null = null;

    constructor(
        public dialogRef: MatDialogRef<UserEnterprisesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: UserEnterprisesDialogData,
        private managedUsersService: ManagedUsersService
    ) {}

    get user(): User {
        return this.data.user;
    }

    ngOnInit(): void {
        this.loadUserEnterprises();
    }

    private loadUserEnterprises(): void {
        this.loading = true;
        this.managedUsersService.getManagedUserEnterprises(this.data.user.id)
            .then((enterprises) => {
                this.assignedEnterprises = enterprises ?? [];
                this.updateAvailable();
                this.loading = false;
            })
            .catch(() => {
                this.loading = false;
            });
    }

    private updateAvailable(): void {
        const assignedIds = new Set(this.assignedEnterprises.map(e => e.id));
        this.availableEnterprises = (this.data.managerEnterprises ?? []).filter(e => !assignedIds.has(e.id));
    }

    onAdd(enterprise: Enterprise): void {
        if (this.actionInProgress) return;
        this.actionInProgress = { enterpriseId: enterprise.id };
        this.managedUsersService.addManagedUserToEnterprise(this.data.user.id, enterprise.id)
            .then(() => {
                this.assignedEnterprises = [...this.assignedEnterprises, enterprise];
                this.updateAvailable();
            })
            .finally(() => {
                this.actionInProgress = null;
            });
    }

    onRemove(enterprise: Enterprise): void {
        if (this.actionInProgress) return;
        this.actionInProgress = { enterpriseId: enterprise.id };
        this.managedUsersService.removeManagedUserFromEnterprise(this.data.user.id, enterprise.id)
            .then(() => {
                this.assignedEnterprises = this.assignedEnterprises.filter(e => e.id !== enterprise.id);
                this.updateAvailable();
            })
            .finally(() => {
                this.actionInProgress = null;
            });
    }

    isActionInProgress(enterpriseId: number): boolean {
        return this.actionInProgress?.enterpriseId === enterpriseId;
    }

    onClose(): void {
        this.data.onSuccess?.();
        this.dialogRef.close();
    }
}
