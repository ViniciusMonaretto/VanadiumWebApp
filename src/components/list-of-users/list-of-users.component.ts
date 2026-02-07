import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IoButtonComponent } from '../io-button/io-button.component';
import { User, UserType } from '../../models/user';

@Component({
    selector: 'list-of-users',
    templateUrl: './list-of-users.component.html',
    styleUrls: ['./list-of-users.component.scss'],
    imports: [CommonModule, MatIconModule, MatButtonModule, IoButtonComponent],
    standalone: true
})
export class ListOfUsersComponent {

    @Input() canEdit: boolean = false;
    @Input() users: User[] = [];

    @Output() addUser = new EventEmitter<void>();
    @Output() removeUser = new EventEmitter<User>();

    getGridStyle(): Record<string, string> {
        return {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '10px',
            paddingBottom: '10px'
        };
    }

    getUserTypeLabel(type: UserType): string {
        const labels: Record<UserType, string> = {
            [UserType.Admin]: 'Administrador',
            [UserType.Manager]: 'Gerente',
            [UserType.User]: 'Usuário'
        };
        return labels[type] ?? 'Usuário';
    }
}
