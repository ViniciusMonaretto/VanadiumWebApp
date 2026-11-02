import { TestBed } from '@angular/core/testing';

import { EventAlarmManagerService } from './event-alarm-manager.service';
import { ApiService } from './api.service';
import { UiPanelService } from './ui-panels.service';
import { AlarmKind, AlarmLevel, parseAlarmKind, parseAlarmLevel } from '../enum/alarm-type';
import { EventAlarmModule } from '../models/event-alarm-module';

describe('EventAlarmManagerService', () => {
  let service: EventAlarmManagerService;
  let api: jasmine.SpyObj<ApiService>;
  let listeners: { [event: string]: (...args: any[]) => void };

  // What the hub sends: enums as camelCase strings
  const anomalyDto = {
    id: 5, alarmId: 3, panelId: 1, timestamp: '2026-11-04T17:15:44Z', value: 3.4,
    name: 'Geladeira', severity: 'critical', kind: 'anomaly'
  };

  beforeEach(() => {
    listeners = {};
    api = jasmine.createSpyObj('ApiService', ['addListener', 'send']);
    api.addListener.and.callFake((event: string, callback: any) => { listeners[event] = callback; });
    api.send.and.returnValue(Promise.resolve([]));
    const uiPanelService = jasmine.createSpyObj('UiPanelService', ['addOnEnterpriseChangedCallback', 'GetPanelById']);
    uiPanelService.GetPanelById.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        EventAlarmManagerService,
        { provide: ApiService, useValue: api },
        { provide: UiPanelService, useValue: uiPanelService },
      ]
    });
    service = TestBed.inject(EventAlarmManagerService);
  });

  describe('enum parsing', () => {
    it('should read severities sent as strings or numbers', () => {
      expect(parseAlarmLevel('critical')).toBe(AlarmLevel.CRITICAL);
      expect(parseAlarmLevel('Info')).toBe(AlarmLevel.INFO);
      expect(parseAlarmLevel(2)).toBe(AlarmLevel.CRITICAL);
      expect(parseAlarmLevel(undefined)).toBe(AlarmLevel.WARNING);
    });

    it('should read alarm kinds sent as strings or numbers', () => {
      expect(parseAlarmKind('anomaly')).toBe(AlarmKind.ANOMALY);
      expect(parseAlarmKind(1)).toBe(AlarmKind.ANOMALY);
      expect(parseAlarmKind('threshold')).toBe(AlarmKind.THRESHOLD);
      expect(parseAlarmKind(undefined)).toBe(AlarmKind.THRESHOLD);
    });
  });

  describe('live events', () => {
    it('should keep the kind and severity of a live event', () => {
      listeners['alarmeventreceived'](anomalyDto);

      const [evt] = service.getEvents();
      expect(evt.kind).toBe(AlarmKind.ANOMALY);
      expect(evt.level).toBe(AlarmLevel.CRITICAL);
      expect(evt.panelId).toBe(1);
    });

    it('should notify listeners until they unsubscribe', () => {
      const received: EventAlarmModule[][] = [];
      const stop = service.addNewEventsListener(events => received.push(events));

      listeners['alarmeventreceived'](anomalyDto);
      stop();
      listeners['alarmeventreceived']({ ...anomalyDto, id: 6 });

      expect(received.length).toBe(1);
      expect(received[0][0].id).toBe(5);
    });
  });

  describe('getAnomalyEvents', () => {
    it('should ask the hub for anomaly events of the panels in the period', async () => {
      const from = new Date('2026-11-01T00:00:00Z');
      const to = new Date('2026-11-05T00:00:00Z');

      await service.getAnomalyEvents([1, 2], from, to);

      expect(api.send).toHaveBeenCalledWith('GetAlarmEvents', {
        PanelIds: [1, 2], Kind: 'anomaly',
        StartDate: '2026-11-01T00:00:00.000Z', EndDate: '2026-11-05T00:00:00.000Z'
      });
    });

    it('should return only anomaly events as models', async () => {
      api.send.and.returnValue(Promise.resolve([anomalyDto, { ...anomalyDto, id: 6, kind: 'threshold' }]));

      const events = await service.getAnomalyEvents([1]);

      expect(events.map(e => e.id)).toEqual([5]);
      expect(events[0].kind).toBe(AlarmKind.ANOMALY);
    });

    it('should not call the hub without panels', async () => {
      expect(await service.getAnomalyEvents([])).toEqual([]);
      expect(api.send).not.toHaveBeenCalled();
    });
  });
});
