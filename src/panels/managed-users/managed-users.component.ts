import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MainScreenSelector } from '../../services/main-screen-selector.service';
import { ManagedUsersService } from '../../services/managed-users.service';
import { ListOfUsersComponent } from '../../components/list-of-users/list-of-users.component';
import { ManagedUserAddWindowComponent } from '../../components/managed-user-add-window/managed-user-add-window.component';
import { UserEnterprisesDialogComponent } from '../../components/user-enterprises-dialog/user-enterprises-dialog.component';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-managed-users',
    templateUrl: './managed-users.component.html',
    styleUrls: ['./managed-users.component.scss'],
    imports: [CommonModule, ListOfUsersComponent],
    standalone: true
})
export class ManagedUsersComponent implements OnInit {

    @Input() forceCanEdit = false;

    managedUsers: User[] = [];

    constructor(
        private mainScreenService: MainScreenSelector,
        private managedUsersService: ManagedUsersService,
        private authService: AuthService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.refreshList();
    }

    getManagedUsers(): User[] {
        return this.managedUsers;
    }

    canEdit(): boolean {
        return this.forceCanEdit || this.mainScreenService.CanEdit();
    }

    onAddUser(): void {
        this.dialog.open(ManagedUserAddWindowComponent, {
            width: '450px',
            data: {
                onSuccess: () => this.refreshList()
            }
        });
    }

    onRemoveUser(user: User): void {
        this.managedUsersService.removeManagedUser(user.id).then(() => this.refreshList());
    }

    onUserClick(user: User): void {
        this.dialog.open(UserEnterprisesDialogComponent, {
            width: '480px',
            data: {
                user,
                managerEnterprises: this.authService.getEnterprises(),
                onSuccess: () => this.refreshList()
            }
        });
    }

    private refreshList(): void {
        this.managedUsersService.loadManagedUsers().then((users) => {
            this.managedUsers = users ?? [];
        });
    }
}
