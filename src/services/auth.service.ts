import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isAuthenticated: boolean = false;
    private currentUser: string | null = null;

    constructor(private api: ApiService) {
        // Check if user is already authenticated (e.g., from localStorage)
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('currentUser');
        if (storedAuth === 'true' && storedUser) {
            this.isAuthenticated = true;
            this.currentUser = storedUser;
        }
    }

    login(username: string, password: string): Observable<boolean> {
        // TODO: Replace with actual API call to your authentication endpoint
        // For now, this is a placeholder that simulates an API call
        return of({ success: true }).pipe(
            delay(500), // Simulate network delay
            map(() => {
                // Placeholder authentication logic
                // In a real application, you would make an HTTP call to your backend
                if (username && password) {
                    this.isAuthenticated = true;
                    this.currentUser = username;
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('currentUser', username);
                    return true;
                }
                return false;
            })
        );
    }

    logout(): void {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
    }

    isLoggedIn(): boolean {
        return this.isAuthenticated;
    }

    getCurrentUser(): string | null {
        return this.currentUser;
    }
}

