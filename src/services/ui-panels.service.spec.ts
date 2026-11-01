import { TestBed } from '@angular/core/testing';

import { UiPanelService } from './ui-panels.service';
import { ApiService } from './api.service';
import { DialogHelper } from './dialog-helper.service';
import { SensorModule } from '../models/sensor-module';

function sensor(gatewayId: string, index: number): SensorModule {
  const s = new SensorModule();
  s.gatewayId = gatewayId;
  s.index = index;
  return s;
}

describe('UiPanelService live subscriptions', () => {
  let service: UiPanelService;
  let listeners: { [event: string]: (...args: any[]) => void };

  // What the server pushes for each gateway message
  const pushReadings = (gatewayId: string, timestamp: string, readings: { sensor_id: number, value: number }[]) =>
    listeners['sensorDataBatchReceived']([{ gatewayId, telemetry: { timestamp, readings } }]);

  beforeEach(() => {
    listeners = {};
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            addListener: (event: string, cb: any) => listeners[event] = cb,
            addOnConnectCallback: () => {},
            send: () => Promise.resolve()
          }
        },
        { provide: DialogHelper, useValue: {} }
      ]
    });
    service = TestBed.inject(UiPanelService);
  });

  it('should call a subscribed callback with each new reading', () => {
    const callback = jasmine.createSpy('callback');
    service.addPanelSubscription(sensor('GW1', 2), callback);

    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 7.5 }]);

    expect(callback).toHaveBeenCalledOnceWith('GW1-2', { value: 7.5, active: true, timestamp: '2026-01-10T13:00:00Z' });
  });

  it('should only call the callback for its own sensor', () => {
    const callback = jasmine.createSpy('callback');
    service.addPanelSubscription(sensor('GW1', 2), callback);

    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 3, value: 1 }]);
    pushReadings('GW2', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 1 }]);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should deliver every reading in one message', () => {
    const first = jasmine.createSpy('first');
    const second = jasmine.createSpy('second');
    service.addPanelSubscription(sensor('GW1', 1), first);
    service.addPanelSubscription(sensor('GW1', 2), second);

    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 1, value: 10 }, { sensor_id: 2, value: 20 }]);

    expect(first.calls.mostRecent().args[1].value).toBe(10);
    expect(second.calls.mostRecent().args[1].value).toBe(20);
  });

  it('should stop calling a callback once it is removed', () => {
    const panel = sensor('GW1', 2);
    const callback = jasmine.createSpy('callback');
    service.addPanelSubscription(panel, callback);

    service.removePanelSubscription(panel, callback);
    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 1 }]);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should remove only the given callback', () => {
    const panel = sensor('GW1', 2);
    const chart = jasmine.createSpy('chart');
    const other = jasmine.createSpy('other');
    service.addPanelSubscription(panel, chart);
    service.addPanelSubscription(panel, other);

    service.removePanelSubscription(panel, chart);
    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 1 }]);

    expect(chart).not.toHaveBeenCalled();
    expect(other).toHaveBeenCalled();
  });

  it('should keep the Monitor card updating when a chart callback is removed', () => {
    const panel = sensor('GW1', 2);
    const callback = jasmine.createSpy('callback');
    service.addPanelSubscription(panel);
    service.addPanelSubscription(panel, callback);

    service.removePanelSubscription(panel, callback);
    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 42 }]);

    expect(panel.value).toBe(42);
  });

  it('should still remove the sensor itself when no callback is given', () => {
    const panel = sensor('GW1', 2);
    service.addPanelSubscription(panel);

    service.removePanelSubscription(panel);
    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 42 }]);

    expect(panel.value).toBeNull();
  });

  it('should ignore removing a callback that was never added', () => {
    const panel = sensor('GW1', 2);
    service.addPanelSubscription(panel);

    service.removePanelSubscription(panel, () => {});
    pushReadings('GW1', '2026-01-10T13:00:00Z', [{ sensor_id: 2, value: 42 }]);

    expect(panel.value).toBe(42);
  });
});
