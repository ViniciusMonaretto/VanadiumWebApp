import { Injectable } from '@angular/core';
import { GatewayModule } from '../models/gateway-model';
import { ApiService } from './api.service';
import { UiPanelService } from './ui-panels.service';
import { getLastActivityLabel } from '../utils/date-util';

@Injectable({
    providedIn: 'root'
})
export class GatewayService {
    gateways: {[id: string]: GatewayModule} = {}

    constructor(
        private api: ApiService,
        private uiPanelService: UiPanelService
      ) {
        this.api.addListener("GatewaySystemInfoReceived", (gateway: any) => {
            const existing = this.gateways[gateway.gatewayId] ?? new GatewayModule();
            existing.gatewayId = gateway.gatewayId;
            if (!existing.name) existing.name = gateway.gatewayId;
            existing.ip = gateway.ipAddress;
            existing.uptime = gateway.uptime;
            existing.lastActivity = gateway.lastActivity ? getLastActivityLabel(new Date(gateway.lastActivity)) : '';
            existing.status = gateway.isConnected ? "online" : "offline";
            existing.availableSensors = gateway.availableSensors ?? [];
            this.gateways[gateway.gatewayId] = existing;
        });
        this.uiPanelService.addOnEnterpriseChangedCallback(() => {
          this.gateways = {}
          this.updateGateway()
        })
        this.api.addOnConnectCallback(() => {
          this.updateGateway()
        })
      }

      public getGateways()
      {
        return this.gateways
      }

      public updateGateway()
      {
        return this.api.send("GetGatewayInfo", null).then((gateways: {[id: string]:
          {gatewayId: string, ipAddress: string, isConnected: boolean, uptime: Date, lastActivity: Date, availableSensors: string[]}}) =>
          {
            this.gateways = {};
            for (let gateway of Object.values(gateways)) {
              this.gateways[gateway.gatewayId] = new GatewayModule();
              this.gateways[gateway.gatewayId].gatewayId = gateway.gatewayId;
              this.gateways[gateway.gatewayId].name = gateway.gatewayId;
              this.gateways[gateway.gatewayId].ip = gateway.ipAddress;
              this.gateways[gateway.gatewayId].uptime = gateway.uptime;
              this.gateways[gateway.gatewayId].lastActivity = getLastActivityLabel(new Date(gateway.lastActivity));
              this.gateways[gateway.gatewayId].status = gateway.isConnected ? "online" : "offline";
              this.gateways[gateway.gatewayId].availableSensors = gateway.availableSensors ?? [];
            }

          })
      }

      public addGateway(gatewayId: string) {
        this.api.send("AddGateway", { gatewayId: gatewayId }).then(() => {
          this.gateways[gatewayId] = new GatewayModule();
          this.gateways[gatewayId].gatewayId = gatewayId;
          this.gateways[gatewayId].name = gatewayId;
          this.gateways[gatewayId].ip = '';
          this.gateways[gatewayId].status = 'offline';
          this.gateways[gatewayId].lastActivity = '';
        });
      }

      public deleteGateway(gatewayId: string) {
        this.api.send("DeleteGateway", gatewayId ).then(() => {
          delete this.gateways[gatewayId];
        });
      }
}
