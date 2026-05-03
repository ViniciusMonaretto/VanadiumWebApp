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
import { UiPanelService } from '../../services/ui-panels.service';
import { Enterprise } from '../../models/enterprise';

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

    email: string = '';
    password: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private dialogHelper: DialogHelper,
        private uiPanelService: UiPanelService
    ) {
    }

    ngOnInit(): void {
    }

    setEnterprise(enterprise: Enterprise): void {
        this.uiPanelService.RequestSelectedEnterpriseGroups(enterprise)?.then((success: boolean) => {
          if (success) {
            this.uiPanelService.setSelectedEnterprise(enterprise);
            this.router.navigate(['/main']);
          }
        });
      }

    login() {
        if (this.email != null && this.password != null) {
            this.authService.login(this.email, this.password).then((success) => {
                if (success) {
                    //this.router.navigate(['/manager']); 
                    if (this.authService.getEnterprises().length > 0) {
                        this.setEnterprise(this.authService.getEnterprises()[0]);
                    } else {
                        this.router.navigate(['/manager']);
                    }
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

}

