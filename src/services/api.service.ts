import { Injectable, Inject, InjectionToken } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { DialogHelper } from './dialog-helper.service';
import { firstValueFrom } from 'rxjs';


export const WS_URL_TOKEN = new InjectionToken<string>('wsUrl');

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public connection: signalR.HubConnection | null = null;
    onConnectCallbacks: Function[] = [];

    baseUrl = "";

    constructor(private Http: HttpClient, private dialogHelper: DialogHelper) {
    }

    async load(): Promise<void> {
        var config = await firstValueFrom(
            this.Http.get<any>('/assets/appSettings.json')
        );

        this.baseUrl = config["apiUrl"];
    }

    startConnection() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.baseUrl) // URL do seu Hub
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection
            .start()
            .then(() => {
                console.log('Conexão SignalR iniciada.')
                for(var callback of this.onConnectCallbacks) {
                    callback();
                }
            })
            .catch(err => console.log('Erro ao iniciar conexão: ' + err));
    }

    addListener(eventName: string, callback: (...args: any[]) => void) {
        if (!this.connection) {
            console.error('Connection not initialized. Call startConnection() first.');
            return;
        }
        this.connection.on(eventName, callback);
    }

    send(eventName: string, data: any): Promise<any> {
        if (!this.connection) {
            console.error('Connection not initialized. Call startConnection() first.');
            return Promise.reject('Connection not initialized');
        }
        return this.connection.invoke(eventName, data)
            .catch(err => console.error(err));
    }

    addOnConnectCallback(callback: Function) {
        this.onConnectCallbacks.push(callback);
    }

}