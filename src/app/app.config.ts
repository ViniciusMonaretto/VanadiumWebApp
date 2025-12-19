import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideCharts } from 'ng2-charts';  // Correct function: provideCharts

import { APP_INITIALIZER } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiService } from '../services/api.service';

// Factory function to create WebSocket URL based on current browser location
function createWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/websocket`;
}

export function initConfig(config: ApiService) {
  return async () => {
    await config.load();
    config.startConnection();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [ApiService],
      multi: true
    }
  ]
};
