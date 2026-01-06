import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUser: string | null = null;
    private userToken: string | null = null;

    constructor(private api: ApiService) {
        // Check if user is already authenticated (e.g., from localStorage)
        const storedToken = localStorage.getItem('storedToken');
        if (storedToken) {
            this.userToken = storedToken;
        }
    }

    login(username: string, password: string): Promise<boolean> {
        // TODO: Replace with actual API call to your authentication endpoint
        // For now, this is a placeholder that simulates an API call
        return this.api.send("Login", { email: username, password: password })
            .then((response) => {
                if (response == null)
                {
                    return false;
                }
                this.userToken = response.token;
                //localStorage.setItem('storedToken', this.userToken ?? '');
                return true;
            }).catch((error) => {
                console.error('Login error:', error);
                return false;
            });
    }

    logout(): void {
        this.currentUser = null;
        localStorage.removeItem('storedToken');
    }

    isLoggedIn(): boolean {
        return this.userToken !== null && this.userToken !== '';
    }

    getCurrentUser(): string | null {
        return this.currentUser;
    }
}

