import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { GraphRequestWindowComponent } from './graph-request-window.component';
import { DialogHelper } from '../../services/dialog-helper.service';
import { GroupInfo } from '../../services/ui-panels.service';
import { SensorModule } from '../../models/sensor-module';

function sensor(id: number, name: string, color = '#3D5BAE'): SensorModule {
  const s = new SensorModule();
  s.id = id;
  s.name = name;
  s.color = color;
  return s;
}

function group(id: number, name: string, panels: SensorModule[]): GroupInfo {
  const g = new GroupInfo();
  g.id = id;
  g.name = name;
  g.panels = panels;
  return g;
}

describe('GraphRequestWindowComponent', () => {
  let component: GraphRequestWindowComponent;
  let fixture: ComponentFixture<GraphRequestWindowComponent>;
  let element: HTMLElement;
  let dialogRef: jasmine.SpyObj<MatDialogRef<GraphRequestWindowComponent>>;
  let callback: jasmine.Spy;

  const freezer = sensor(1, 'Freezer 01');
  const camara = sensor(2, 'Câmara Fria');
  const caldeira = sensor(3, 'Caldeira');
  const freezer2 = sensor(4, 'Freezer 02');

  function setup(selectedSensorIds?: number[]) {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    callback = jasmine.createSpy('callback');

    TestBed.configureTestingModule({
      imports: [GraphRequestWindowComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: DialogHelper, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            uiConfig: {
              '10': group(10, 'Cozinha', [freezer, camara]),
              '20': group(20, 'Utilidades', [caldeira, freezer2])
            },
            selectedSensorIds,
            callback
          }
        }
      ]
    });

    fixture = TestBed.createComponent(GraphRequestWindowComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  const rows = () => Array.from(element.querySelectorAll<HTMLElement>('.sensor-row'));
  const rowFor = (name: string) => rows().find(r => r.querySelector('.sensor-label')!.textContent!.trim() === name)!;
  const addButton = () => element.querySelectorAll('io-button')[1] as HTMLElement;
  const search = (text: string) => {
    const input = element.querySelector<HTMLInputElement>('.search-input')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  describe('sensor list', () => {
    beforeEach(() => setup());

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should list the sensors from every group', () => {
      expect(component.sensors.map(s => s.name)).toEqual(['Freezer 01', 'Câmara Fria', 'Caldeira', 'Freezer 02']);
      expect(rows().length).toBe(4);
    });

    it('should return every group', () => {
      expect(component.getGroups().map(g => g.name)).toEqual(['Cozinha', 'Utilidades']);
    });

    it('should show each sensor colour', () => {
      const dot = rowFor('Freezer 01').querySelector<HTMLElement>('.color-dot')!;
      expect(dot.style.background).toContain('rgb(61, 91, 174)');
    });

    it('should start with nothing selected when the chart is empty', () => {
      expect(component.selectedSensors.size).toBe(0);
      expect(component.validForm()).toBeFalse();
    });
  });

  describe('keeping the current chart selection', () => {
    it('should pre-select the sensors already on the chart', () => {
      setup([2, 3]);

      expect(component.isSensorSelected(camara)).toBeTrue();
      expect(component.isSensorSelected(caldeira)).toBeTrue();
      expect(component.isSensorSelected(freezer)).toBeFalse();
      expect(rowFor('Câmara Fria').classList).toContain('sensor-row--active');
    });

    it('should ignore ids that are no longer available', () => {
      setup([2, 999]);

      expect(component.selectedSensors.size).toBe(1);
    });
  });

  describe('selecting sensors', () => {
    beforeEach(() => setup());

    it('should select a sensor when its row is clicked', () => {
      rowFor('Caldeira').click();
      fixture.detectChanges();

      expect(component.isSensorSelected(caldeira)).toBeTrue();
      expect(rowFor('Caldeira').classList).toContain('sensor-row--active');
    });

    it('should select a sensor when its name is clicked', () => {
      rowFor('Caldeira').querySelector<HTMLElement>('.sensor-label')!.click();

      expect(component.isSensorSelected(caldeira)).toBeTrue();
    });

    it('should select a sensor when its switch is clicked', () => {
      rowFor('Caldeira').querySelector<HTMLElement>('.toggle-track')!.click();

      expect(component.isSensorSelected(caldeira)).toBeTrue();
    });

    it('should toggle exactly once per click', () => {
      rowFor('Caldeira').querySelector<HTMLElement>('.toggle-track')!.click();
      rowFor('Caldeira').querySelector<HTMLElement>('.toggle-track')!.click();

      expect(component.isSensorSelected(caldeira)).toBeFalse();
    });

    it('should keep the switch in sync with the selection', () => {
      rowFor('Caldeira').click();
      fixture.detectChanges();

      const checkbox = rowFor('Caldeira').querySelector<HTMLInputElement>('.toggle-native')!;
      expect(checkbox.checked).toBeTrue();
      expect(rowFor('Caldeira').getAttribute('aria-checked')).toBe('true');
    });

    it('should not toggle the sensor when the colour picker is clicked', () => {
      rowFor('Caldeira').querySelector<HTMLElement>('.color-input')!.click();

      expect(component.isSensorSelected(caldeira)).toBeFalse();
    });

    it('should toggle with the Space key', () => {
      rowFor('Caldeira').dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(component.isSensorSelected(caldeira)).toBeTrue();
    });

    it('should toggle with the Enter key', () => {
      rowFor('Caldeira').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(component.isSensorSelected(caldeira)).toBeTrue();
    });

    it('should make rows reachable with the keyboard', () => {
      expect(rows().every(r => r.getAttribute('tabindex') === '0')).toBeTrue();
      expect(rows().every(r => r.getAttribute('role') === 'checkbox')).toBeTrue();
    });

    it('should unselect a selected sensor', () => {
      component.toggleSensor(freezer);
      component.toggleSensor(freezer);

      expect(component.isSensorSelected(freezer)).toBeFalse();
    });

    it('should select every sensor with "Todos"', () => {
      component.selectAll();

      expect(component.selectedSensors.size).toBe(4);
    });

    it('should clear the selection with "Nenhum"', () => {
      component.selectAll();

      component.deselectAll();

      expect(component.selectedSensors.size).toBe(0);
    });

    it('should only select the visible sensors with "Todos" while searching', () => {
      search('freezer');

      component.selectAll();

      expect(component.selectedSensors.size).toBe(2);
      expect(component.isSensorSelected(freezer)).toBeTrue();
      expect(component.isSensorSelected(freezer2)).toBeTrue();
    });
  });

  describe('search', () => {
    beforeEach(() => setup());

    it('should filter by name, ignoring case', () => {
      search('FREEZER');

      expect(rows().length).toBe(2);
      expect(component.filteredSensors).toEqual([freezer, freezer2]);
    });

    it('should match part of a name', () => {
      search('fria');

      expect(component.filteredSensors).toEqual([camara]);
    });

    it('should show every sensor again when the search is cleared', () => {
      search('freezer');
      element.querySelector<HTMLButtonElement>('.search-clear')!.click();
      fixture.detectChanges();

      expect(component.searchFilter).toBe('');
      expect(rows().length).toBe(4);
    });

    it('should only show the clear button while searching', () => {
      expect(element.querySelector('.search-clear')).toBeNull();

      search('cal');

      expect(element.querySelector('.search-clear')).not.toBeNull();
    });

    it('should show an empty state when nothing matches', () => {
      search('xyz');

      expect(rows().length).toBe(0);
      expect(element.querySelector('.empty-state')!.textContent).toContain('Nenhum sensor encontrado');
    });

    it('should keep the selection while searching', () => {
      component.toggleSensor(caldeira);

      search('freezer');

      expect(component.isSensorSelected(caldeira)).toBeTrue();
    });
  });

  describe('Adicionar / Cancelar', () => {
    beforeEach(() => setup());

    it('should disable Adicionar until a sensor is selected', () => {
      expect(addButton().classList).toContain('io-button--disabled');

      component.toggleSensor(freezer);
      fixture.detectChanges();

      expect(addButton().classList).not.toContain('io-button--disabled');
    });

    it('should send the selected sensors and close', () => {
      component.toggleSensor(freezer);
      component.toggleSensor(caldeira);

      component.onAddCLick();

      expect(callback).toHaveBeenCalledOnceWith({ selectedSensors: [freezer, caldeira] });
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should send the selection when Adicionar is clicked', () => {
      component.toggleSensor(camara);
      fixture.detectChanges();

      addButton().querySelector('button')!.click();

      expect(callback).toHaveBeenCalledOnceWith({ selectedSensors: [camara] });
    });

    it('should close without sending anything on Cancelar', () => {
      component.toggleSensor(freezer);

      component.onNoClick();

      expect(callback).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should show Cancelar as a neutral button, not a red one', () => {
      const cancel = element.querySelectorAll('io-button')[0];

      expect(cancel.textContent!.trim()).toBe('Cancelar');
      expect(cancel.classList).toContain('io-button--secondary');
    });
  });
});
