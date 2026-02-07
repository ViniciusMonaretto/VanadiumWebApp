import { Enterprise } from './enterprise';

export enum UserType {
    Admin = 0,
    Manager = 1,
    User = 2
}

export interface User {
    id: number;
    name: string;
    email: string;
    userType: UserType;
    managerId?: number;
    enterprises?: Enterprise[];
    managedUsers?: User[];
}

export interface CreateManagedUserDto {
    name: string;
    username: string;
    email: string;
    company?: string | null;
    password: string;
}
