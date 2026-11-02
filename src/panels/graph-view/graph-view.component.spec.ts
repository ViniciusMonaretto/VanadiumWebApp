import '../../testing/chart-test-setup';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { provideCharts } from 'ng2-charts';

import { GraphViewComponent } from './graph-view.component';
import { UiPanelService } from '../../services/ui-panels.service';
import { GraphRequestWindowComponent } from '../../components/graph-request-window/graph-request-window.component';
import { AdvancedChartComponent } from '../../components/advanced-chart/advanced-chart.component';
import { SensorModule } from '../../models/sensor-module';
import { EventAlarmModule } from '../../models/event-alarm-module';
import { EventAlarmManagerService } from '../../services/event-alarm-manager.service';
import { AlarmKind } from '../../enum/alarm-type';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function sensor(id: number, name: string, color: string): SensorModule {
  const s = new SensorModule();
  s.id = id;
  s.name = name;
  s.color = color;
  return s;
}

describe('GraphViewComponent', () => {
  let component: GraphViewComponent;
  let fixture: ComponentFixture<GraphViewComponent>;
  let element: HTMLElement;
  let uiPanelService: jasmine.SpyObj<UiPanelService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let alarmService: jasmine.SpyObj<EventAlarmManagerService>;
  let liveAlarmListener: (events: EventAlarmModule[]) => void;
  let stopAlarmListener: jasmine.Spy;

  const freezer = sensor(1, 'Freezer', '#ff0000');
  const caldeira = sensor(2, 'Caldeira', '#00ff00');
  const uiConfig = { '10': { id: 10, name: 'Cozinha', panels: [freezer, caldeira] } };

  const readings: { [id: string]: any[] } = {
    '1': [
      { readingTime: '2026-01-10T12:00:00Z', value: 5 },
      { readingTime: '2026-01-10T10:00:00Z', value: 3 },
      { readingTime: '2026-01-10T11:00:00Z', value: 4 }
    ],
    '2': [
      { readingTime: '2026-01-10T10:30:00Z', value: 80 }
    ]
  };

  // Subtitle text without the "Ao vivo" badge
  const subtitle = () => {
    const p = element.querySelector('.page-subtitle')!.cloneNode(true) as HTMLElement;
    p.querySelector('.live-badge')?.remove();
    return p.textContent!.replace(/\s+/g, ' ').trim();
  };
  const liveBadge = () => element.querySelector('.live-badge');
  const pill = (label: string) =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('.pill')).find(p => p.textContent!.trim() === label)!;
  const lastRequest = () => uiPanelService.sendRequestForTableInfo.calls.mostRecent().args;

  async function load(sensors: SensorModule[]) {
    component.getTable({ selectedSensors: sensors });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    spyOn(console, 'log');
    uiPanelService = jasmine.createSpyObj('UiPanelService',
      ['GetUiConfig', 'sendRequestForTableInfo', 'addPanelSubscription', 'removePanelSubscription']);
    uiPanelService.GetUiConfig.and.returnValue(uiConfig as any);
    uiPanelService.sendRequestForTableInfo.and.callFake(() => Promise.resolve(readings));
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    alarmService = jasmine.createSpyObj('EventAlarmManagerService', ['getAnomalyEvents', 'addNewEventsListener']);
    alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([]));
    stopAlarmListener = jasmine.createSpy('stopAlarmListener');
    alarmService.addNewEventsListener.and.callFake((listener: any) => {
      liveAlarmListener = listener;
      return stopAlarmListener;
    });

    await TestBed.configureTestingModule({
      imports: [GraphViewComponent],
      providers: [
        provideCharts(),
        { provide: UiPanelService, useValue: uiPanelService },
        { provide: MatDialog, useValue: dialog },
        { provide: EventAlarmManagerService, useValue: alarmService }
      ]
    })
    // The page injects MatDialog itself; make sure it gets the spy, not the module's provider
    .overrideComponent(GraphViewComponent, { set: { providers: [{ provide: MatDialog, useValue: dialog }] } })
    .compileComponents();

    fixture = TestBed.createComponent(GraphViewComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('period presets', () => {
    it('should start on "Hoje", from midnight until now', () => {
      expect(component.activePreset).toBe('today');
      const from = component.dateFrom!;
      const to = component.dateTo!;
      expect(from.getHours()).toBe(0);
      expect(from.getMinutes()).toBe(0);
      expect(from.toDateString()).toBe(to.toDateString());
      expect(pill('Hoje').classList).toContain('pill--active');
    });

    const durations: [string, number][] = [
      ['1h', HOUR],
      ['6h', 6 * HOUR],
      ['12h', 12 * HOUR],
      ['24h', DAY],
      ['7d', 7 * DAY],
      ['30d', 30 * DAY]
    ];

    durations.forEach(([preset, duration]) => {
      it(`should cover the last ${preset}`, () => {
        const before = Date.now();
        component.setPreset(preset);
        const after = Date.now();

        expect(component.dateTo!.getTime()).toBeGreaterThanOrEqual(before);
        expect(component.dateTo!.getTime()).toBeLessThanOrEqual(after);
        expect(component.dateTo!.getTime() - component.dateFrom!.getTime()).toBe(duration);
      });
    });

    it('should fall back to the last 24h for an unknown preset', () => {
      component.setPreset('bogus');

      expect(component.dateTo!.getTime() - component.dateFrom!.getTime()).toBe(DAY);
    });

    it('should fill the date fields in the datetime-local format', () => {
      component.setPreset('1h');

      expect(component.dateFromString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(component.dateToString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      const from = component.dateFrom!;
      const pad = (n: number) => n.toString().padStart(2, '0');
      expect(component.dateFromString).toBe(
        `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}T${pad(from.getHours())}:${pad(from.getMinutes())}`);
    });

    it('should highlight the clicked preset', () => {
      pill('7d').click();
      fixture.detectChanges();

      expect(component.activePreset).toBe('7d');
      expect(pill('7d').classList).toContain('pill--active');
      expect(pill('Hoje').classList).not.toContain('pill--active');
    });

    it('should show every preset', () => {
      const labels = Array.from(element.querySelectorAll('.pill')).map(p => p.textContent!.trim());

      expect(labels).toEqual(['1h', '6h', '12h', '24h', 'Hoje', '7d', '30d']);
    });

    it('should not request data when no sensor is on the chart', () => {
      component.setPreset('6h');

      expect(uiPanelService.sendRequestForTableInfo).not.toHaveBeenCalled();
    });
  });

  describe('Selecionar sensores', () => {
    it('should show the button with a clear label', () => {
      expect(element.querySelector('.btn-config')!.textContent).toContain('Selecionar sensores');
    });

    it('should open the sensor picker with every group', () => {
      (element.querySelector('.btn-config') as HTMLButtonElement).click();

      expect(dialog.open).toHaveBeenCalledTimes(1);
      const [dialogComponent, config] = dialog.open.calls.mostRecent().args as any[];
      expect(dialogComponent).toBe(GraphRequestWindowComponent);
      expect(config.width).toBe('500px');
      expect(config.data.uiConfig).toBe(uiConfig);
    });

    it('should open the picker with nothing selected on an empty chart', () => {
      component.openAddWindow();

      const config = dialog.open.calls.mostRecent().args[1] as any;
      expect(config.data.selectedSensorIds).toEqual([]);
    });

    it('should open the picker with the sensors already on the chart', async () => {
      await load([freezer, caldeira]);

      component.openAddWindow();

      const config = dialog.open.calls.mostRecent().args[1] as any;
      expect(config.data.selectedSensorIds).toEqual([1, 2]);
    });

    it('should load the sensors chosen in the picker', async () => {
      component.openAddWindow();
      const config = dialog.open.calls.mostRecent().args[1] as any;

      config.data.callback({ selectedSensors: [caldeira] });
      await fixture.whenStable();

      expect(uiPanelService.sendRequestForTableInfo).toHaveBeenCalledWith([2], component.dateFrom, component.dateTo);
      expect(component.lineChartData.map(l => l.label)).toEqual(['Caldeira']);
    });
  });

  describe('loading data', () => {
    it('should request the selected sensors for the current period', async () => {
      component.setPreset('6h');

      await load([freezer, caldeira]);

      const [ids, from, to] = lastRequest();
      expect(ids).toEqual([1, 2]);
      expect(from).toBe(component.dateFrom);
      expect(to).toBe(component.dateTo);
    });

    it('should draw one line per sensor, named and coloured after it', async () => {
      await load([freezer, caldeira]);

      expect(component.lineChartData.length).toBe(2);
      const line = component.lineChartData.find(l => l.label === 'Freezer');
      expect(line.borderColor).toBe('#ff0000');
      expect(line.backgroundColor).toBe('#ff00000A');
      expect(line.fill).toBeFalse();
    });

    it('should sort each line by time', async () => {
      await load([freezer]);

      const values = component.lineChartData[0].data.map((p: any) => p.y);
      expect(values).toEqual([3, 4, 5]);
      const times = component.lineChartData[0].data.map((p: any) => p.x);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    });

    it('should convert reading times to timestamps', async () => {
      await load([caldeira]);

      expect(component.lineChartData[0].data).toEqual([{ x: Date.parse('2026-01-10T10:30:00Z'), y: 80 }]);
    });

    it('should skip readings with an invalid time', async () => {
      spyOn(console, 'error');
      uiPanelService.sendRequestForTableInfo.and.resolveTo({
        '1': [{ readingTime: 'not a date', value: 1 }, { readingTime: '2026-01-10T10:00:00Z', value: 2 }]
      });

      await load([freezer]);

      expect(component.lineChartData[0].data.map((p: any) => p.y)).toEqual([2]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should ignore data for sensors that were not requested', async () => {
      await load([freezer]);

      expect(component.lineChartData.map(l => l.label)).toEqual(['Freezer']);
    });

    it('should replace the previous lines instead of adding to them', async () => {
      await load([freezer, caldeira]);

      await load([caldeira]);

      expect(component.lineChartData.map(l => l.label)).toEqual(['Caldeira']);
    });

    it('should pass the lines to the chart', async () => {
      await load([freezer, caldeira]);

      const chart = fixture.debugElement.query(By.directive(AdvancedChartComponent)).componentInstance as AdvancedChartComponent;
      expect(chart.dataSources).toBe(component.lineChartData);
      expect(element.querySelector('.source-count')!.textContent!.trim()).toBe('2 fontes');
    });
  });

  describe('header', () => {
    it('should say no sensor is selected on an empty chart', () => {
      expect(subtitle()).toBe('Nenhum sensor selecionado');
    });

    it('should use the singular for one sensor', async () => {
      await load([freezer]);

      expect(subtitle()).toBe('1 sensor ativo');
    });

    it('should use the plural for several sensors', async () => {
      await load([freezer, caldeira]);

      expect(subtitle()).toBe('2 sensores ativos');
    });
  });

  describe('changing the period reloads the chart', () => {
    beforeEach(async () => {
      await load([freezer, caldeira]);
      uiPanelService.sendRequestForTableInfo.calls.reset();
    });

    it('should reload the same sensors when a preset is clicked', async () => {
      pill('24h').click();
      await fixture.whenStable();

      expect(uiPanelService.sendRequestForTableInfo).toHaveBeenCalledTimes(1);
      const [ids, from, to] = lastRequest();
      expect(ids).toEqual([1, 2]);
      expect(to!.getTime() - from!.getTime()).toBe(DAY);
    });

    it('should reload when a custom period is typed', async () => {
      component.dateFromString = '2026-01-01T08:00';
      component.dateToString = '2026-01-02T18:30';

      component.onDateFilterChange();
      await fixture.whenStable();

      const [ids, from, to] = lastRequest();
      expect(ids).toEqual([1, 2]);
      expect(from).toEqual(new Date(2026, 0, 1, 8, 0));
      expect(to).toEqual(new Date(2026, 0, 2, 18, 30));
    });

    it('should unhighlight the preset when a custom period is typed', () => {
      component.dateFromString = '2026-01-01T08:00';
      component.onDateFilterChange();
      fixture.detectChanges();

      expect(component.activePreset).toBe('');
      expect(element.querySelectorAll('.pill--active').length).toBe(0);
    });

    it('should reload when the date field changes', async () => {
      const input = element.querySelectorAll<HTMLInputElement>('.range-input')[0];
      input.value = '2026-01-01T08:00';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
      await fixture.whenStable();

      expect(component.dateFrom).toEqual(new Date(2026, 0, 1, 8, 0));
      expect(uiPanelService.sendRequestForTableInfo).toHaveBeenCalledTimes(1);
    });

    it('should not reload while a date is incomplete', () => {
      component.dateFromString = '';

      component.onDateFilterChange();

      expect(uiPanelService.sendRequestForTableInfo).not.toHaveBeenCalled();
    });
  });

  describe('Limpar', () => {
    beforeEach(async () => {
      await load([freezer, caldeira]);
    });

    it('should remove every line', () => {
      component.clearGraphLines();

      expect(component.lineChartData).toEqual([]);
      expect(component.selectedSensorIds).toEqual([]);
    });

    it('should reset the header', () => {
      component.clearGraphLines();
      fixture.detectChanges();

      expect(subtitle()).toBe('Nenhum sensor selecionado');
    });

    it('should not reload anything after the chart was cleared', () => {
      component.clearGraphLines();
      uiPanelService.sendRequestForTableInfo.calls.reset();

      component.setPreset('7d');

      expect(uiPanelService.sendRequestForTableInfo).not.toHaveBeenCalled();
    });

    it('should open the picker empty after the chart was cleared', () => {
      component.clearGraphLines();

      component.openAddWindow();

      const config = dialog.open.calls.mostRecent().args[1] as any;
      expect(config.data.selectedSensorIds).toEqual([]);
    });

    it('should be wired to the chart toolbar "Limpar" button', () => {
      const limpar = Array.from(element.querySelectorAll<HTMLButtonElement>('.tool-btn'))
        .find(b => b.textContent!.trim() === 'Limpar')!;

      limpar.click();

      expect(component.lineChartData).toEqual([]);
    });
  });

  describe('IoCloud Predict faults', () => {
    function fault(id: number, panelId: number, timestamp: string, kind = AlarmKind.ANOMALY): EventAlarmModule {
      const e = new EventAlarmModule();
      e.id = id;
      e.panelId = panelId;
      e.timestamp = timestamp as any;
      e.kind = kind;
      return e;
    }
    const chart = () =>
      fixture.debugElement.query(By.directive(AdvancedChartComponent)).componentInstance as AdvancedChartComponent;

    it('should request the faults of the selected sensors for the current period', async () => {
      await load([freezer, caldeira]);

      const [ids, from, to] = alarmService.getAnomalyEvents.calls.mostRecent().args;
      expect(ids).toEqual([1, 2]);
      expect(from).toBe(component.dateFrom);
      expect(to).toBe(component.dateTo);
    });

    it('should mark each fault start with the sensor colour and name', async () => {
      alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([
        fault(7, 1, '2026-01-10T11:00:00Z'),
        fault(8, 2, '2026-01-10T11:30:00Z'),
      ]));

      await load([freezer, caldeira]);

      expect(component.faultMarkers).toEqual([
        { id: 7, x: Date.parse('2026-01-10T11:00:00Z'), label: 'Falha · Freezer', color: '#ff0000' },
        { id: 8, x: Date.parse('2026-01-10T11:30:00Z'), label: 'Falha · Caldeira', color: '#00ff00' },
      ]);
      expect(chart().faultMarkers).toBe(component.faultMarkers);
      expect(element.querySelector('.fault-count')!.textContent!.replace(/\s+/g, ' ').trim())
        .toBe('2 falhas detectadas');
    });

    it('should ignore threshold events, other sensors and invalid times', async () => {
      alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([
        fault(1, 1, '2026-01-10T11:00:00Z', AlarmKind.THRESHOLD),
        fault(2, 99, '2026-01-10T11:00:00Z'),
        fault(3, 1, 'not a date'),
      ]));

      await load([freezer]);

      expect(component.faultMarkers).toEqual([]);
      expect(element.querySelector('.fault-count')).toBeNull();
    });

    it('should keep the chart working when the faults cannot be loaded', async () => {
      spyOn(console, 'warn');
      alarmService.getAnomalyEvents.and.returnValue(Promise.reject('no such hub method'));

      await load([freezer]);

      expect(component.lineChartData.map(l => l.label)).toEqual(['Freezer']);
      expect(component.faultMarkers).toEqual([]);
    });

    it('should drop the markers of a previous load', async () => {
      alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([fault(7, 1, '2026-01-10T11:00:00Z')]));
      await load([freezer]);
      alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([]));

      await load([caldeira]);

      expect(component.faultMarkers).toEqual([]);
    });

    it('should add a fault reported live while the chart is live', async () => {
      await load([freezer]);

      liveAlarmListener([fault(9, 1, '2026-01-10T12:30:00Z')]);
      liveAlarmListener([fault(9, 1, '2026-01-10T12:30:00Z')]); // same event again

      expect(component.faultMarkers.map(m => m.id)).toEqual([9]);
    });

    it('should not add live faults for sensors off the chart or on a custom period', async () => {
      await load([freezer]);
      liveAlarmListener([fault(9, 2, '2026-01-10T12:30:00Z')]);
      expect(component.faultMarkers).toEqual([]);

      component.activePreset = '';
      liveAlarmListener([fault(10, 1, '2026-01-10T12:30:00Z')]);
      expect(component.faultMarkers).toEqual([]);
    });

    it('should clear the markers with the lines', async () => {
      alarmService.getAnomalyEvents.and.returnValue(Promise.resolve([fault(7, 1, '2026-01-10T11:00:00Z')]));
      await load([freezer]);

      component.clearGraphLines();

      expect(component.faultMarkers).toEqual([]);
    });

    it('should stop listening when the page is destroyed', () => {
      fixture.destroy();
      expect(stopAlarmListener).toHaveBeenCalled();
    });
  });

  describe('live updates', () => {
    // Simulates the service delivering a new reading for a sensor on the chart
    const liveCallback = (s: SensorModule) =>
      uiPanelService.addPanelSubscription.calls.allArgs().filter(args => args[0] === s).pop()![1] as Function;
    const sendReading = (s: SensorModule, timestamp: string, value: number) =>
      liveCallback(s)(`gw-${s.index}`, { value, active: true, timestamp });
    const values = (label: string) =>
      component.lineChartData.find(l => l.label === label)!.data.map((p: any) => p.y);

    // Readings are batched with a timer; wait for it as well as for Angular
    async function settle() {
      await new Promise(resolve => setTimeout(resolve));
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('should subscribe every sensor on the chart once the history is loaded', async () => {
      await load([freezer, caldeira]);

      expect(uiPanelService.addPanelSubscription).toHaveBeenCalledTimes(2);
      expect(uiPanelService.addPanelSubscription.calls.argsFor(0)[0]).toBe(freezer);
      expect(uiPanelService.addPanelSubscription.calls.argsFor(1)[0]).toBe(caldeira);
    });

    it('should not subscribe before the history arrives', () => {
      component.getTable({ selectedSensors: [freezer] });

      expect(uiPanelService.addPanelSubscription).not.toHaveBeenCalled();
    });

    it('should add a new reading to the end of its line', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5, 6]);
      const data = component.lineChartData[0].data;
      expect(data[data.length - 1].x).toBe(Date.parse('2026-01-10T13:00:00Z'));
    });

    it('should send the new reading to the chart', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      await settle();

      const chart = fixture.debugElement.query(By.directive(AdvancedChartComponent)).componentInstance as AdvancedChartComponent;
      expect(chart.dataSources[0].data.length).toBe(4);
    });

    it('should add readings for several sensors from one message', async () => {
      await load([freezer, caldeira]);

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      sendReading(caldeira, '2026-01-10T13:00:00Z', 81);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5, 6]);
      expect(values('Caldeira')).toEqual([80, 81]);
    });

    it('should redraw once for a burst of readings', async () => {
      await load([freezer, caldeira]);
      let redraws = 0;
      let data = component.lineChartData;
      Object.defineProperty(component, 'lineChartData', {
        configurable: true,
        get: () => data,
        set: v => { redraws++; data = v; }
      });

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      sendReading(freezer, '2026-01-10T13:00:05Z', 7);
      sendReading(caldeira, '2026-01-10T13:00:00Z', 81);
      await settle();

      expect(redraws).toBe(1);
      expect(values('Freezer')).toEqual([3, 4, 5, 6, 7]);
    });

    it('should skip a reading that is already on the chart', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T12:00:00Z', 5);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should skip a reading older than the last point', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T11:30:00Z', 99);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should ignore a reading with an invalid time', async () => {
      await load([freezer]);

      sendReading(freezer, 'not a date', 6);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should ignore a reading without a value', async () => {
      await load([freezer]);

      liveCallback(freezer)('gw-0', { active: true, timestamp: '2026-01-10T13:00:00Z' });
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should keep a zero reading', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T13:00:00Z', 0);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5, 0]);
    });

    it('should start a line for a sensor that had no history', async () => {
      uiPanelService.sendRequestForTableInfo.and.resolveTo({});
      await load([caldeira]);
      expect(component.lineChartData.length).toBe(0);

      sendReading(caldeira, '2026-01-10T13:00:00Z', 81);
      await settle();

      const line = component.lineChartData[0];
      expect(line.label).toBe('Caldeira');
      expect(line.borderColor).toBe('#00ff00');
      expect(line.data).toEqual([{ x: Date.parse('2026-01-10T13:00:00Z'), y: 81 }]);
    });

    it('should not add readings while a custom period is shown', async () => {
      await load([freezer]);
      component.dateFromString = '2026-01-10T00:00';
      component.dateToString = '2026-01-10T12:30';
      component.onDateFilterChange();
      await settle();

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should resume when a preset is picked again', async () => {
      await load([freezer]);
      component.dateFromString = '2026-01-10T00:00';
      component.onDateFilterChange();
      await settle();

      pill('24h').click();
      await settle();
      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5, 6]);
    });

    it('should unsubscribe the old callbacks when the chart is reloaded', async () => {
      await load([freezer, caldeira]);
      const oldFreezer = liveCallback(freezer);
      const oldCaldeira = liveCallback(caldeira);

      pill('6h').click();
      await settle();

      expect(uiPanelService.removePanelSubscription).toHaveBeenCalledWith(freezer, oldFreezer);
      expect(uiPanelService.removePanelSubscription).toHaveBeenCalledWith(caldeira, oldCaldeira);
      expect(uiPanelService.addPanelSubscription).toHaveBeenCalledTimes(4);
    });

    it('should drop readings that were waiting when the chart was reloaded', async () => {
      await load([freezer]);

      sendReading(freezer, '2026-01-10T13:00:00Z', 6);
      component.getTable({ selectedSensors: [freezer] });
      await settle();

      expect(values('Freezer')).toEqual([3, 4, 5]);
    });

    it('should unsubscribe when the chart is cleared', async () => {
      await load([freezer]);
      const callback = liveCallback(freezer);

      component.clearGraphLines();

      expect(uiPanelService.removePanelSubscription).toHaveBeenCalledWith(freezer, callback);
    });

    it('should not draw a line again after the chart was cleared', async () => {
      await load([freezer]);
      sendReading(freezer, '2026-01-10T13:00:00Z', 6);

      component.clearGraphLines();
      await settle();

      expect(component.lineChartData).toEqual([]);
    });

    it('should unsubscribe when leaving the page', async () => {
      await load([freezer, caldeira]);

      fixture.destroy();

      expect(uiPanelService.removePanelSubscription).toHaveBeenCalledTimes(2);
    });

    it('should ignore a slower, older response', async () => {
      let resolveFirst!: (value: any) => void;
      uiPanelService.sendRequestForTableInfo.and.returnValues(
        new Promise(resolve => resolveFirst = resolve),
        Promise.resolve({ '2': readings['2'] })
      );

      component.getTable({ selectedSensors: [freezer] });
      component.getTable({ selectedSensors: [caldeira] });
      await settle();
      resolveFirst(readings);
      await settle();

      expect(component.lineChartData.map(l => l.label)).toEqual(['Caldeira']);
      expect(uiPanelService.addPanelSubscription).toHaveBeenCalledTimes(1);
      expect(uiPanelService.addPanelSubscription.calls.argsFor(0)[0]).toBe(caldeira);
    });

    it('should ignore a response that arrives after the chart was cleared', async () => {
      let resolve!: (value: any) => void;
      uiPanelService.sendRequestForTableInfo.and.returnValue(new Promise(r => resolve = r));

      component.getTable({ selectedSensors: [freezer] });
      component.clearGraphLines();
      resolve(readings);
      await settle();

      expect(component.lineChartData).toEqual([]);
      expect(uiPanelService.addPanelSubscription).not.toHaveBeenCalled();
    });

    describe('"Ao vivo" badge', () => {
      it('should not show on an empty chart', () => {
        expect(liveBadge()).toBeNull();
      });

      it('should show while a preset is active', async () => {
        await load([freezer]);

        expect(liveBadge()!.textContent!.trim()).toBe('Ao vivo');
      });

      it('should hide for a custom period', async () => {
        await load([freezer]);

        component.dateFromString = '2026-01-10T00:00';
        component.onDateFilterChange();
        await settle();

        expect(liveBadge()).toBeNull();
      });
    });
  });
});
