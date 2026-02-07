import { Routes } from '@angular/router';
import { MainScreenComponent } from '../panels/main-screen/main-screen.component';
import { LoginComponent } from '../panels/login/login.component';
import { ManagerScreenComponent } from '../panels/manager-screen/manager-screen.component';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'manager', component: ManagerScreenComponent, canActivate: [authGuard] },
    { path: 'main', component: MainScreenComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
