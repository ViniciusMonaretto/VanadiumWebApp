import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { DialogHelper } from '../../services/dialog-helper.service';

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

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private dialogHelper: DialogHelper
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
            
            this.authService.login(username, password).then((success) => {
                if (success) {
                    this.router.navigate(['/manager']);
                } else {
                    this.dialogHelper.openErrorDialog('Email ou senha inválidos');
                }
            }).catch((error) => {
                this.dialogHelper.openErrorDialog('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
                console.error('Login error:', error);
            });
        } else {
            this.dialogHelper.openErrorDialog('Por favor, preencha todos os campos obrigatórios');
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

}

