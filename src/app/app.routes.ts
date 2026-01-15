import { Routes } from '@angular/router';
import { MainScreenComponent } from '../panels/main-screen/main-screen.component';
import { LoginComponent } from '../panels/login/login.component';
import { EnterpriseSelectionComponent } from '../panels/enterprise-selection/enterprise-selection.component';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'main', component: MainScreenComponent, canActivate: [authGuard] }, // Define the route for MyComponent
    { path: 'enterprise-selection', component: EnterpriseSelectionComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' } // Redirect to login by default
];
