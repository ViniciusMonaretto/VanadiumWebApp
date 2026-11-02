import '../../testing/chart-test-setup';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideCharts } from 'ng2-charts';

import { AdvancedChartComponent } from './advanced-chart.component';
import { DrawingMode, GraphComponent } from '../graph/graph.component';

describe('AdvancedChartComponent', () => {
  let component: AdvancedChartComponent;
  let fixture: ComponentFixture<AdvancedChartComponent>;
  let element: HTMLElement;

  const toolButton = (label: string) =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('.tool-btn'))
      .find(button => button.textContent!.trim() === label)!;
  const graph = () => fixture.debugElement.query(By.directive(GraphComponent)).componentInstance as GraphComponent;

  beforeEach(async () => {
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [AdvancedChartComponent],
      providers: [provideCharts()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedChartComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    component.dataSources = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toolbar', () => {
    it('should show every tool in Portuguese', () => {
      const labels = Array.from(element.querySelectorAll('.tool-btn')).map(b => b.textContent!.trim());

      expect(labels).toEqual(['Zoom', 'Mover', 'Ref. cruz', 'Ref. V', 'Ref. H', 'Redefinir', 'Limpar']);
    });

    it('should not show the old Zoom + / − buttons', () => {
      expect(element.querySelector('[title="Zoom In"]')).toBeNull();
      expect(element.querySelector('[title="Zoom Out"]')).toBeNull();
    });

    it('should start with Zoom selected', () => {
      expect(component.activeTool).toBe('zoom');
      expect(toolButton('Zoom').classList).toContain('active');
      expect(toolButton('Mover').classList).not.toContain('active');
    });

    it('should select Mover when clicked', () => {
      toolButton('Mover').click();
      fixture.detectChanges();

      expect(component.activeTool).toBe('pan');
      expect(toolButton('Mover').classList).toContain('active');
      expect(toolButton('Zoom').classList).not.toContain('active');
    });

    it('should tell the chart when Mover is selected', () => {
      toolButton('Mover').click();
      fixture.detectChanges();

      expect(graph().zoomEnabled).toBeFalse();
    });

    it('should tell the chart when Zoom is selected again', () => {
      toolButton('Mover').click();
      fixture.detectChanges();
      toolButton('Zoom').click();
      fixture.detectChanges();

      expect(graph().zoomEnabled).toBeTrue();
    });
  });

  describe('reference line modes', () => {
    it('should have no drawing mode by default', () => {
      expect(component.getDrawingMode()).toBe(DrawingMode.None);
    });

    it('should map crosshair mode to drawing both lines', () => {
      component.toggleCrosshairRefMode();
      expect(component.getDrawingMode()).toBe(DrawingMode.Both);
    });

    it('should map vertical mode to drawing vertical lines', () => {
      component.toggleReferenceLinesModeVertical();
      expect(component.getDrawingMode()).toBe(DrawingMode.Vertical);
    });

    it('should map horizontal mode to drawing horizontal lines', () => {
      component.toggleReferenceLinesModeHorizontal();
      expect(component.getDrawingMode()).toBe(DrawingMode.Horizontal);
    });

    it('should turn a mode off when toggled twice', () => {
      component.toggleReferenceLinesModeVertical();
      component.toggleReferenceLinesModeVertical();

      expect(component.getDrawingMode()).toBe(DrawingMode.None);
    });

    it('should allow only one mode at a time', () => {
      component.toggleCrosshairRefMode();
      component.toggleReferenceLinesModeVertical();
      expect(component.crosshairRefMode).toBeFalse();
      expect(component.referenceLinesModeVertical).toBeTrue();

      component.toggleReferenceLinesModeHorizontal();
      expect(component.referenceLinesModeVertical).toBeFalse();
      expect(component.referenceLinesModeHorizontal).toBeTrue();

      component.toggleCrosshairRefMode();
      expect(component.referenceLinesModeHorizontal).toBeFalse();
      expect(component.crosshairRefMode).toBeTrue();
    });

    it('should highlight the active mode button', () => {
      toolButton('Ref. H').click();
      fixture.detectChanges();

      expect(toolButton('Ref. H').classList).toContain('active');
      expect(toolButton('Ref. V').classList).not.toContain('active');
      expect(toolButton('Ref. cruz').classList).not.toContain('active');
    });

    it('should pass the drawing mode to the chart', () => {
      toolButton('Ref. V').click();
      fixture.detectChanges();

      expect(graph().drawingMode).toBe(DrawingMode.Vertical);
    });

    it('should use a crosshair cursor over the chart while drawing', () => {
      toolButton('Ref. cruz').click();
      fixture.detectChanges();

      expect(element.querySelector('.canvas-wrapper')!.classList).toContain('reference-mode');
    });

    it('should leave drawing mode when Escape is pressed', () => {
      component.toggleCrosshairRefMode();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.getDrawingMode()).toBe(DrawingMode.None);
    });

    it('should stop listening to the keyboard once destroyed', () => {
      component.toggleCrosshairRefMode();

      fixture.destroy();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.getDrawingMode()).toBe(DrawingMode.Both);
    });

    it('should remove the same listener it added', () => {
      const added = spyOn(document, 'addEventListener').and.callThrough();
      const removed = spyOn(document, 'removeEventListener').and.callThrough();
      const other = TestBed.createComponent(AdvancedChartComponent);
      other.componentInstance.dataSources = [];
      other.detectChanges();

      other.destroy();

      const keydownAdded = added.calls.allArgs().filter(args => args[0] === 'keydown');
      const keydownRemoved = removed.calls.allArgs().filter(args => args[0] === 'keydown');
      expect(keydownAdded.length).toBe(1);
      expect(keydownRemoved.length).toBe(1);
      expect(keydownRemoved[0][1]).toBe(keydownAdded[0][1]);
    });

    it('should ignore other keys', () => {
      component.toggleReferenceLinesModeHorizontal();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(component.getDrawingMode()).toBe(DrawingMode.Horizontal);
    });
  });

  describe('Redefinir', () => {
    it('should refit the chart', () => {
      const before = component.resizeTrigger;

      toolButton('Redefinir').click();

      expect(component.resizeTrigger).toBe(!before);
    });

    it('should also clear the reference lines', () => {
      const before = component.clearRefLinesTrigger;

      component.resetZoom();

      expect(component.clearRefLinesTrigger).toBe(!before);
    });
  });

  describe('Limpar', () => {
    it('should be disabled when the chart has no data', () => {
      expect(component.hasGraphLines()).toBeFalse();
      expect(toolButton('Limpar').disabled).toBeTrue();
    });

    it('should be enabled when the chart has data', () => {
      component.dataSources = [{ label: 'A', data: [] }];
      fixture.detectChanges();

      expect(component.hasGraphLines()).toBeTrue();
      expect(toolButton('Limpar').disabled).toBeFalse();
    });

    it('should ask the page to remove the data and clear the reference lines', () => {
      const emitted = jasmine.createSpy('requestClearDataSources');
      component.requestClearDataSources.subscribe(emitted);
      component.dataSources = [{ label: 'A', data: [] }];
      fixture.detectChanges();
      const before = component.clearRefLinesTrigger;

      toolButton('Limpar').click();

      expect(emitted).toHaveBeenCalled();
      expect(component.clearRefLinesTrigger).toBe(!before);
    });
  });

  describe('source count', () => {
    const count = () => element.querySelector('.source-count')!.textContent!.trim();

    it('should say "0 fontes" with no data', () => {
      expect(count()).toBe('0 fontes');
    });

    it('should use the singular for one source', () => {
      component.dataSources = [{ label: 'A', data: [] }];
      fixture.detectChanges();

      expect(count()).toBe('1 fonte');
    });

    it('should use the plural for several sources', () => {
      component.dataSources = [{ label: 'A', data: [] }, { label: 'B', data: [] }];
      fixture.detectChanges();

      expect(count()).toBe('2 fontes');
    });
  });
});
