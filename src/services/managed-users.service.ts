import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User, CreateManagedUserDto } from '../models/user';
import { Enterprise } from '../models/enterprise';
import { DialogHelper } from './dialog-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';

@Injectable({
    providedIn: 'root'
})
export class ManagedUsersService {
    private managedUsers: User[] = [];
    private spinnerDialogRef: MatDialogRef<SpinnerComponent> | null = null;

    constructor(private api: ApiService, private dialogHelper: DialogHelper) {}

    getManagedUsers(): User[] {
        return this.managedUsers;
    }

    loadManagedUsers(): Promise<User[]> {
        this.openSpinnerDialog('Carregando usuários gerenciados');
        return this.api.send('GetManagedUsers', null)
            .then((response: any) => {
                this.closeSpinnerDialog();
                this.managedUsers = Array.isArray(response) ? response : (response?.managedUsers ?? response ?? []);
                return this.managedUsers;
            })
            .catch((err) => {
                this.closeSpinnerDialog();
                this.dialogHelper.openErrorDialog('Erro ao carregar usuários: ' + (err?.message ?? err));
                return [];
            });
    }

    addManagedUser(userId: number): Promise<void> {
        this.openSpinnerDialog('Adicionando usuário');
        return this.api.send('AddManagedUser', { userId })
            .then(() => {
                this.closeSpinnerDialog();
                return this.loadManagedUsers();
            })
            .then(() => {});
    }

    createManagedUser(dto: CreateManagedUserDto): Promise<void> {
        this.openSpinnerDialog('Criando usuário gerenciado');
        return this.api.send('AddManagedUser', dto)
            .then(() => {
                this.closeSpinnerDialog();
                return this.loadManagedUsers();
            })
            .then(() => {})
            .catch((err) => {
                this.closeSpinnerDialog();
                this.dialogHelper.openErrorDialog('Erro ao criar usuário: ' + (err?.message ?? err));
                throw err;
            });
    }

    removeManagedUser(userId: number): Promise<void> {
        this.openSpinnerDialog('Removendo usuário');
        return this.api.send('RemoveManagedUser', userId)
            .then(() => {
                this.closeSpinnerDialog();
                this.managedUsers = this.managedUsers.filter(u => u.id !== userId);
            })
            .catch((err) => {
                this.closeSpinnerDialog();
                this.dialogHelper.openErrorDialog('Erro ao remover usuário: ' + (err?.message ?? err));
            });
    }

    getAvailableUsersToAdd(): Promise<User[]> {
        return this.api.send('GetAvailableUsersToManage', null)
            .then((response: any) => Array.isArray(response) ? response : (response ?? []))
            .catch(() => []);
    }

    getManagedUserEnterprises(userId: number): Promise<Enterprise[]> {
        return this.api.send('GetUserEnterprises', userId)
            .then((response: any) => Array.isArray(response) ? response : (response?.enterprises ?? response ?? []))
            .catch((err) => {
                this.dialogHelper.openErrorDialog('Erro ao carregar empresas do usuário: ' + (err?.message ?? err));
                return [];
            });
    }

    addManagedUserToEnterprise(userId: number, enterpriseId: number): Promise<void> {
        return this.api.sendWithArgs('AddUserToEnterprise', userId, enterpriseId)
            .then((result: boolean) => {
                if (!result) {
                    throw new Error('');
                }
            })
            .catch((err) => {
                const msg = (err?.message ?? err)?.toString()?.trim();
                if (msg) {
                    this.dialogHelper.openErrorDialog('Erro ao adicionar usuário à empresa: ' + msg);
                }
                throw err;
            });
    }

    removeManagedUserFromEnterprise(userId: number, enterpriseId: number): Promise<void> {
        return this.api.sendWithArgs('RemoveUserFromEnterprise', userId, enterpriseId)
            .then(() => {})
            .catch((err) => {
                const msg = (err?.message ?? err)?.toString()?.trim();
                if (msg) {
                    this.dialogHelper.openErrorDialog('Erro ao remover usuário da empresa: ' + msg);
                }
                throw err;
            });
    }

    private openSpinnerDialog(message: string): void {
        if (this.spinnerDialogRef) this.closeSpinnerDialog();
        this.spinnerDialogRef = this.dialogHelper.showSpinnerDialog(message, true);
    }

    private closeSpinnerDialog(): void {
        this.spinnerDialogRef?.close();
        this.spinnerDialogRef = null;
    }
}
