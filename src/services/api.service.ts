import { Injectable, Inject, InjectionToken } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { DialogHelper } from './dialog-helper.service';
import { delay, firstValueFrom } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { AuthService } from './auth.service';


export const WS_URL_TOKEN = new InjectionToken<string>('wsUrl');

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public connection: signalR.HubConnection | null = null;
    onConnectCallbacks: Function[] = [];
    private pendingListeners: Array<{ eventName: string; callback: (...args: any[]) => void }> = [];
    private spinnerDialogRef: MatDialogRef<SpinnerComponent> | null = null;
    baseUrl = "";
    authToken: string | null = null;
    unauthorizedCallback: Function | null = null;

    constructor(private Http: HttpClient, private dialogHelper: DialogHelper) {
    }

    async load(): Promise<void> {
        var config = await firstValueFrom(
            this.Http.get<any>('/assets/appSettings.json')
        );

        this.baseUrl = config["apiUrl"];
    }

    connectToTheServer() {
        if (!this.connection) {
            return;
        }

        this.connection
            .start()
            .then(() => {
                console.log('Transporte SignalR iniciado.');
                
                // registra listeners pendentes
                for (const listener of this.pendingListeners) {
                    this.connection!.on(listener.eventName, listener.callback);
                }
                this.pendingListeners = [];
            })
            .catch(err => {
                console.log('Erro ao iniciar conexão: ' + err)
                setTimeout(() => {
                    this.connectToTheServer();
                }, 5000);
            });
    }

    startConnection() {
        if (!this.spinnerDialogRef) {
            this.spinnerDialogRef = this.dialogHelper.showSpinnerDialog("Iniciando conexão com o servidor", true);
        }
        
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.baseUrl)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();
    
        // 🔥 Escuta o evento do servidor
        this.connection.on('Connected', () => {
            console.log('Hub fully connected');
    
            for (const callback of this.onConnectCallbacks) {
                callback();
            }
            this.spinnerDialogRef?.close();
            this.spinnerDialogRef = null;
        });

        // Listen for authentication errors from the hub
        this.connection.on('Error', (errorMessage: string) => {
            console.error('Hub authentication error:', errorMessage);
            if (errorMessage === 'Authentication required' || errorMessage === 'Invalid or expired token') {
                // Clear token on authentication errors
                this.authToken = null;
            }
        });

        // Reconnection event handlers
        this.connection.onreconnecting((error) => {
            if (!this.spinnerDialogRef) {
                this.spinnerDialogRef = this.dialogHelper.showSpinnerDialog("Reconectando com o servidor", true);
            }
        });

        this.connection.onreconnected((connectionId) => {
            this.spinnerDialogRef?.close();
            this.spinnerDialogRef = null;

            for (const callback of this.onConnectCallbacks) {
                callback();
            }
        });
    
        this.connectToTheServer();
    }

    addListener(eventName: string, callback: (...args: any[]) => void) {
        if (!this.connection) {
            // Queue the listener to be registered when connection starts
            this.pendingListeners.push({ eventName, callback });
            return;
        }
        this.connection.on(eventName, callback);
    }

    setAuthToken(token: string) {
        this.authToken = token;
    }

    send(eventName: string, data: any | undefined = null): Promise<any> {
        if (!this.connection) {
            console.error('Connection not initialized. Call startConnection() first.');
            return Promise.reject('Connection not initialized');
        }
        
        // Login method doesn't need authToken (it's the authentication method itself)
        // All other methods should pass authToken as a separate parameter (last parameter)
        let invokePromise: Promise<any>;
        
        if (eventName === "Login") {
            // Login doesn't include token - it receives credentials and returns token
            invokePromise = this.connection.invoke(eventName, data);
        } else {
            // For all other methods, pass token as a separate parameter (last parameter)
            // The Hub expects: methodName(data, token) or methodName(token) if no data
            if (data === null || data === undefined) {
                // No data, only pass token
                invokePromise = this.connection.invoke(eventName, this.authToken);
            } else {
                // Pass data first, then token as the last parameter
                invokePromise = this.connection.invoke(eventName, data, this.authToken);
            }
        }
        
        return invokePromise
            .catch(err => {
                if (err.message?.includes("Unauthorized")) {
                    this.unauthorizedCallback?.();
                }
                console.error(`Error invoking '${eventName}':`, err);
                return Promise.reject(err);
            });
    }

    setUnauthorizedCallback(callback: Function) {
        this.unauthorizedCallback = callback;
    }

    addOnConnectCallback(callback: Function) {
        this.onConnectCallbacks.push(callback);
    }

}