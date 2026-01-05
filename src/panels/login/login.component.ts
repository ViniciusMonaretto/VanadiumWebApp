import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule
    ],
    standalone: true
})
export class LoginComponent implements OnInit {

    loginForm: FormGroup;
    errorMessage: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]]
        });
    }

    ngOnInit(): void {
    }

    onSubmit() {
        if (this.loginForm.valid) {
            const username = this.loginForm.get('username')?.value;
            const password = this.loginForm.get('password')?.value;
            
            this.authService.login(username, password).subscribe({
                next: (success) => {
                    if (success) {
                        this.router.navigate(['/main']);
                    } else {
                        this.errorMessage = 'Invalid username or password';
                    }
                },
                error: (error) => {
                    this.errorMessage = 'An error occurred during login. Please try again.';
                    console.error('Login error:', error);
                }
            });
        } else {
            this.errorMessage = 'Please fill in all required fields';
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

}

