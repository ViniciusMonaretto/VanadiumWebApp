import { Injectable, Inject, InjectionToken } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { DialogHelper } from './dialog-helper.service';
import { delay, firstValueFrom } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';


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

    send(eventName: string, data: any | undefined = null): Promise<any> {
        if (!this.connection) {
            console.error('Connection not initialized. Call startConnection() first.');
            return Promise.reject('Connection not initialized');
        }
        if (data === null) {
            return this.connection.invoke(eventName)
                .catch(err => {
                    console.error(`Error invoking '${eventName}':`, err);
                    return Promise.reject(err);
                });
        }
        return this.connection.invoke(eventName, data)
            .catch(err => {
                console.error(`Error invoking '${eventName}':`, err);
                return Promise.reject(err);
            });
    }

    addOnConnectCallback(callback: Function) {
        this.onConnectCallbacks.push(callback);
    }

}