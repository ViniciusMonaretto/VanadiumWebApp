import { Routes } from '@angular/router';
import { MainScreenComponent } from '../panels/main-screen/main-screen.component';
import { LoginComponent } from '../panels/login/login.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'main', component: MainScreenComponent }, // Define the route for MyComponent
    { path: '', redirectTo: '/login', pathMatch: 'full' } // Redirect to login by default
];
