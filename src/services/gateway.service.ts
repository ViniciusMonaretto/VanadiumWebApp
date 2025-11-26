import { Injectable } from '@angular/core';
import { GatewayModule } from '../models/gateway-model';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class GatewayService {
    gateways: GatewayModule[] = []

    constructor(
        private api: ApiService
      ) {
        this.api.addListener("gatewayStatus", (gateways: GatewayModule[]) => {
            this.gateways = gateways
        });
      }

      public getGateways()
      {
        return this.gateways
      }

      public updateGateway()
      {
        this.api.send("updateGateway", null).then(() => {})
      }
}
