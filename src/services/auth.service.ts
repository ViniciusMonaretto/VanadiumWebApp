import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Enterprise } from '../models/enterprise';
import { Router } from '@angular/router';
import { DialogHelper } from './dialog-helper.service';
import { UserType } from '../models/user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUser: string | null = null;
    private userToken: string | null = null;
    private enterprises: Enterprise[] = [];
    private userType: UserType | null = null;
    
    constructor(private api: ApiService, private router: Router, private dialogHelper: DialogHelper) {
        // Check if user is already authenticated (e.g., from localStorage)
        const storedToken = localStorage.getItem('storedToken');
        if (storedToken) {
            this.userToken = storedToken;
        }
        this.api.setUnauthorizedCallback(() => {
            this.logout();
            this.router.navigate(['/login']);
        });

        this.api.addOnConnectCallback(() => {
            if (this.userToken != null) {
                this.dialogHelper.openErrorDialog('Sua sessão expirou. Por favor, faça login novamente.');
            }

            this.logout();
            this.router.navigate(['/login']);
        });
    }

    login(username: string, password: string): Promise<boolean> {
        // TODO: Replace with actual API call to your authentication endpoint
        // For now, this is a placeholder that simulates an API call
        return this.api.send("Login", { username: username, password: password })
            .then((response) => {
                if (response == null)
                {
                    return false;
                }
                this.userToken = response.token;
                this.api.setAuthToken(this.userToken ?? '');
                this.enterprises = response.enterprises;
                this.userType = response.userType;
                //localStorage.setItem('storedToken', this.userToken ?? '');
                return true;
            }).catch((error) => {
                console.error('Login error:', error);
                return false;
            });
    }

    logout(): void {
        this.currentUser = null;
        this.userToken = null;
        this.api.setAuthToken('');
        localStorage.removeItem('storedToken');
    }

    isLoggedIn(): boolean {
        return this.userToken !== null && this.userToken !== '';
    }

    getCurrentUser(): string | null {
        return this.currentUser;
    }

    isUserManager(): boolean {
        return this.userType === UserType.Manager || this.userType === UserType.Admin;
    }

    getEnterprises(): Enterprise[] {
        return this.enterprises;
    }
}

