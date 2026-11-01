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

  const subtitle = () => element.querySelector('.page-subtitle')!.textContent!.replace(/\s+/g, ' ').trim();
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
    uiPanelService = jasmine.createSpyObj('UiPanelService', ['GetUiConfig', 'sendRequestForTableInfo']);
    uiPanelService.GetUiConfig.and.returnValue(uiConfig as any);
    uiPanelService.sendRequestForTableInfo.and.callFake(() => Promise.resolve(readings));
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [GraphViewComponent],
      providers: [
        provideCharts(),
        { provide: UiPanelService, useValue: uiPanelService },
        { provide: MatDialog, useValue: dialog }
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
});
