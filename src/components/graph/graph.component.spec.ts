import '../../testing/chart-test-setup';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts } from 'ng2-charts';

import { DrawingMode, GraphComponent } from './graph.component';

const HOUR = 60 * 60 * 1000;
const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime();

function dataset(points: { x: number, y: number }[], label = 'Freezer') {
  return { label, data: points };
}

describe('GraphComponent', () => {
  let component: GraphComponent;
  let fixture: ComponentFixture<GraphComponent>;

  const annotations = () => (component.lineChartOptions.plugins!.annotation as any).annotations;
  const zoomOptions = () => component.chart!.chart!.options.plugins!.zoom!;

  beforeEach(async () => {
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [GraphComponent],
      providers: [provideCharts()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphComponent);
    component = fixture.componentInstance;
    fixture.nativeElement.style.cssText = 'display:block;width:600px;height:300px';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Chart.js instance', () => {
    expect(component.chart?.chart).toBeTruthy();
  });

  describe('inputInfo', () => {
    it('should keep the datasets and apply the point settings', () => {
      component.inputInfo = [dataset([{ x: T0, y: 1 }], 'A'), dataset([{ x: T0, y: 2 }], 'B')];

      const datasets = component.lineChartData.datasets as any[];
      expect(datasets.length).toBe(2);
      expect(datasets[0].label).toBe('A');
      expect(datasets[1].label).toBe('B');
      expect(datasets[0].pointRadius).toBe(2);
      expect(datasets[0].pointHoverRadius).toBe(4);
      expect(datasets[0].tension).toBe(0);
    });

    it('should fit the Y axis to the data with a 20% margin', () => {
      component.inputInfo = [dataset([{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }])];

      const y = component.lineChartOptions.scales!['y']!;
      expect(y.min).toBeCloseTo(8);
      expect(y.max).toBeCloseTo(22);
    });

    it('should fit the X axis to the first and last reading', () => {
      component.inputInfo = [dataset([{ x: T0 + HOUR, y: 1 }, { x: T0, y: 2 }, { x: T0 + 3 * HOUR, y: 3 }])];

      const x = component.lineChartOptions.scales!['x']!;
      expect(x.min).toBe(T0);
      expect(x.max).toBe(T0 + 3 * HOUR);
    });

    it('should fit the axes across all datasets', () => {
      component.inputInfo = [
        dataset([{ x: T0, y: 5 }]),
        dataset([{ x: T0 + 2 * HOUR, y: 15 }])
      ];

      const scales = component.lineChartOptions.scales!;
      expect(scales['x']!.min).toBe(T0);
      expect(scales['x']!.max).toBe(T0 + 2 * HOUR);
      expect(scales['y']!.min).toBeCloseTo(3);
      expect(scales['y']!.max).toBeCloseTo(17);
    });

    it('should add ±1 to the Y axis when every value is the same', () => {
      component.inputInfo = [dataset([{ x: T0, y: 7 }, { x: T0 + HOUR, y: 7 }])];

      const y = component.lineChartOptions.scales!['y']!;
      expect(y.min).toBe(6);
      expect(y.max).toBe(8);
    });

    it('should show the last hour and a 0–1 Y axis when there is no data', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(T0));
      try {
        component.inputInfo = [];
      } finally {
        jasmine.clock().uninstall();
      }

      const scales = component.lineChartOptions.scales!;
      expect(scales['x']!.min).toBe(T0 - HOUR);
      expect(scales['x']!.max).toBe(T0);
      expect(scales['y']!.min).toBe(0);
      expect(scales['y']!.max).toBe(1);
    });

    it('should limit zoom and pan to the data range', () => {
      component.inputInfo = [dataset([{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }])];

      const limits = component.lineChartOptions.plugins!.zoom!.limits!;
      expect(limits['x']!.min).toBe(T0);
      expect(limits['x']!.max).toBe(T0 + HOUR);
      expect(limits['y']!.min).toBeCloseTo(8);
      expect(limits['y']!.max).toBeCloseTo(22);
    });

    it('should not change the axes when blockFitAll is set', () => {
      component.inputInfo = [dataset([{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }])];
      component.blockFitAll = true;

      component.inputInfo = [dataset([{ x: T0, y: 100 }, { x: T0 + HOUR, y: 200 }])];

      const y = component.lineChartOptions.scales!['y']!;
      expect(y.min).toBeCloseTo(8);
      expect(y.max).toBeCloseTo(22);
    });
  });

  describe('Zoom / Mover tool', () => {
    it('should start in zoom mode: drag zooms, pan is off', () => {
      expect(zoomOptions().zoom!.drag!.enabled).toBeTrue();
      expect(zoomOptions().pan!.enabled).toBeFalse();
    });

    it('should enable pan and disable drag-zoom as soon as Mover is chosen', () => {
      component.zoomEnabled = false;

      expect(zoomOptions().pan!.enabled).toBeTrue();
      expect(zoomOptions().zoom!.drag!.enabled).toBeFalse();
    });

    it('should switch back to drag-zoom when Zoom is chosen again', () => {
      component.zoomEnabled = false;
      component.zoomEnabled = true;

      expect(zoomOptions().zoom!.drag!.enabled).toBeTrue();
      expect(zoomOptions().pan!.enabled).toBeFalse();
    });

    it('should keep mouse-wheel zoom on in both tools', () => {
      component.zoomEnabled = false;
      expect(zoomOptions().zoom!.wheel!.enabled).toBeTrue();

      component.zoomEnabled = true;
      expect(zoomOptions().zoom!.wheel!.enabled).toBeTrue();
    });
  });

  describe('drawing mode', () => {
    it('should turn off zoom and pan while drawing reference lines', () => {
      component.drawingMode = DrawingMode.Horizontal;

      expect(zoomOptions().zoom!.wheel!.enabled).toBeFalse();
      expect(zoomOptions().zoom!.pinch!.enabled).toBeFalse();
      expect(zoomOptions().zoom!.drag!.enabled).toBeFalse();
      expect(zoomOptions().pan!.enabled).toBeFalse();
    });

    it('should show a crosshair cursor while drawing', () => {
      component.drawingMode = DrawingMode.Vertical;

      expect(component.chart!.chart!.canvas.style.cursor).toBe('crosshair');
    });

    it('should restore the active tool when drawing is turned off', () => {
      component.zoomEnabled = false;
      component.drawingMode = DrawingMode.Both;
      component.drawingMode = DrawingMode.None;

      expect(zoomOptions().zoom!.wheel!.enabled).toBeTrue();
      expect(zoomOptions().pan!.enabled).toBeTrue();
      expect(zoomOptions().zoom!.drag!.enabled).toBeFalse();
      expect(component.chart!.chart!.canvas.style.cursor).toBe('default');
    });

    it('should report the mode it was given', () => {
      component.drawingMode = DrawingMode.Both;
      expect(component.drawingMode).toBe(DrawingMode.Both);
    });
  });

  describe('reference lines', () => {
    beforeEach(() => {
      component.inputInfo = [dataset([{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }])];
    });

    it('should add a horizontal line rounded to 2 decimals', () => {
      component.addHorizontalLine(12.3456);

      expect(annotations()['horizontalLine0'].yMin).toBe(12.35);
      expect(annotations()['horizontalLine0'].yMax).toBe(12.35);
      expect(annotations()['horizontalLineText0'].content).toBe('12.35');
    });

    it('should not add the same horizontal line twice', () => {
      component.addHorizontalLine(15);
      component.addHorizontalLine(15.001);

      expect(annotations()['horizontalLine0']).toBeDefined();
      expect(annotations()['horizontalLine1']).toBeUndefined();
    });

    it('should add a vertical line at the given time', () => {
      component.addVerticalLine(T0 + HOUR / 2);

      expect(annotations()['verticalLine0'].xMin).toBe(T0 + HOUR / 2);
      expect(annotations()['verticalLineText0']).toBeDefined();
    });

    it('should not add the same vertical line twice', () => {
      component.addVerticalLine(T0);
      component.addVerticalLine(T0);

      expect(annotations()['verticalLine1']).toBeUndefined();
    });

    it('should remove a horizontal line', () => {
      component.addHorizontalLine(11);
      component.addHorizontalLine(13);

      component.removeHorizontalLine(11);

      expect(annotations()['horizontalLine0'].yMin).toBe(13);
      expect(annotations()['horizontalLine1']).toBeUndefined();
    });

    it('should ignore removing a line that does not exist', () => {
      component.addHorizontalLine(11);

      component.removeHorizontalLine(99);

      expect(annotations()['horizontalLine0'].yMin).toBe(11);
    });

    it('should clear only horizontal lines', () => {
      component.addHorizontalLine(11);
      component.addVerticalLine(T0);

      component.clearAllHorizontalLines();

      expect(annotations()['horizontalLine0']).toBeUndefined();
      expect(annotations()['verticalLine0']).toBeDefined();
    });

    it('should clear only vertical lines', () => {
      component.addHorizontalLine(11);
      component.addVerticalLine(T0);

      component.clearAllVerticalLines();

      expect(annotations()['horizontalLine0']).toBeDefined();
      expect(annotations()['verticalLine0']).toBeUndefined();
    });

    it('should clear every line', () => {
      component.addHorizontalLine(11);
      component.addVerticalLine(T0);

      component.clearAllLines();

      expect(Object.keys(annotations()).length).toBe(0);
    });

    it('should clear every line when the clearLines input changes', () => {
      component.addHorizontalLine(11);
      component.addVerticalLine(T0);

      component.clearLines = true;

      expect(Object.keys(annotations()).length).toBe(0);
    });

    it('should push the lines to the live chart', () => {
      component.addHorizontalLine(14);

      const live = (component.chart!.chart!.options.plugins!.annotation as any).annotations;
      expect(live['horizontalLine0'].yMin).toBe(14);
    });
  });

  describe('drawing lines with the mouse', () => {
    beforeEach(() => {
      component.inputInfo = [dataset([{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }])];
    });

    function hoverAt(x: number | null, y: number | null) {
      (component as any)._isMouseOverChart = true;
      (component as any)._tempMousePosition = { x, y };
    }

    it('should pin a horizontal line where the mouse is in horizontal mode', () => {
      component.drawingMode = DrawingMode.Horizontal;
      hoverAt(null, 16);

      component.handleCanvasClick(new MouseEvent('click'));

      expect(annotations()['horizontalLine0'].yMin).toBe(16);
      expect(annotations()['verticalLine0']).toBeUndefined();
    });

    it('should pin a vertical line where the mouse is in vertical mode', () => {
      component.drawingMode = DrawingMode.Vertical;
      hoverAt(T0, null);

      component.handleCanvasClick(new MouseEvent('click'));

      expect(annotations()['verticalLine0'].xMin).toBe(T0);
      expect(annotations()['horizontalLine0']).toBeUndefined();
    });

    it('should pin both lines in crosshair mode', () => {
      component.drawingMode = DrawingMode.Both;
      hoverAt(T0, 16);

      component.handleCanvasClick(new MouseEvent('click'));

      expect(annotations()['horizontalLine0'].yMin).toBe(16);
      expect(annotations()['verticalLine0'].xMin).toBe(T0);
    });

    it('should show a temporary line that follows the mouse', () => {
      component.drawingMode = DrawingMode.Horizontal;
      hoverAt(null, 18);

      component.updateLines();

      expect(annotations()['tempHorizontalLine'].yMin).toBe(18);
      expect(annotations()['tempHorizontalLineText'].content).toBe('18.00');
    });

    it('should hide the temporary line when the mouse leaves the chart', () => {
      component.drawingMode = DrawingMode.Horizontal;
      hoverAt(null, 18);
      component.updateLines();

      component.handleMouseLeave(new MouseEvent('mouseleave'));

      expect(annotations()['tempHorizontalLine']).toBeUndefined();
    });

    it('should mark the mouse as over the chart on mouse enter', () => {
      component.handleMouseEnter(new MouseEvent('mouseenter'));

      expect((component as any)._isMouseOverChart).toBeTrue();
    });
  });

  describe('live data', () => {
    const initial = [{ x: T0, y: 10 }, { x: T0 + HOUR, y: 20 }];
    const withNewPoint = [...initial, { x: T0 + 2 * HOUR, y: 30 }];

    function zoomIn() {
      component.chart!.chart!.zoom(2);
      expect(component.chart!.chart!.isZoomedOrPanned()).toBeTrue();
    }

    beforeEach(() => {
      component.inputInfo = [dataset(initial)];
    });

    it('should extend the axes to new points when the user has not zoomed', () => {
      component.inputInfo = [dataset(withNewPoint)];

      const scales = component.lineChartOptions.scales!;
      expect(scales['x']!.max).toBe(T0 + 2 * HOUR);
      expect(scales['y']!.max).toBeCloseTo(34);
    });

    it('should keep the user zoom when new points are added', () => {
      zoomIn();
      spyOn(component.chart!.chart!, 'resetZoom').and.callThrough();

      component.inputInfo = [dataset(withNewPoint)];

      expect(component.chart!.chart!.resetZoom).not.toHaveBeenCalled();
      expect(component.chart!.chart!.isZoomedOrPanned()).toBeTrue();
    });

    it('should still let the user pan to the new points while zoomed', () => {
      zoomIn();

      component.inputInfo = [dataset(withNewPoint)];

      expect(component.lineChartOptions.plugins!.zoom!.limits!['x']!.max).toBe(T0 + 2 * HOUR);
    });

    it('should refit when the lines change, even while zoomed', () => {
      zoomIn();
      spyOn(component.chart!.chart!, 'resetZoom').and.callThrough();

      component.inputInfo = [dataset(initial, 'Outro sensor')];

      expect(component.chart!.chart!.resetZoom).toHaveBeenCalled();
    });

    it('should refit when a line is added, even while zoomed', () => {
      zoomIn();
      spyOn(component.chart!.chart!, 'resetZoom').and.callThrough();

      component.inputInfo = [dataset(initial), dataset(initial, 'B')];

      expect(component.chart!.chart!.resetZoom).toHaveBeenCalled();
    });

    it('should refit when a new period is loaded, even while zoomed', () => {
      zoomIn();
      spyOn(component.chart!.chart!, 'resetZoom').and.callThrough();

      component.inputInfo = [dataset([{ x: T0 - 5 * HOUR, y: 1 }, ...initial])];

      expect(component.chart!.chart!.resetZoom).toHaveBeenCalled();
    });

    it('should refit when points are removed, even while zoomed', () => {
      zoomIn();
      spyOn(component.chart!.chart!, 'resetZoom').and.callThrough();

      component.inputInfo = [dataset([initial[0]])];

      expect(component.chart!.chart!.resetZoom).toHaveBeenCalled();
    });
  });

  describe('min / max markers', () => {
    it('should mark the lowest and highest reading of the selected line', () => {
      component.inputInfo = [dataset([
        { x: T0, y: 12 },
        { x: T0 + HOUR, y: 4 },
        { x: T0 + 2 * HOUR, y: 30 }
      ])];

      component.selectedDataLineIndex = 0;

      expect(annotations()['minPoint'].yValue).toBe(4);
      expect(annotations()['minPoint'].xValue).toBe(T0 + HOUR);
      expect(annotations()['minPoint'].label.content).toBe('MIN: 4.00');
      expect(annotations()['maxPoint'].yValue).toBe(30);
      expect(annotations()['maxPoint'].label.content).toBe('MAX: 30.00');
    });

    it('should not show markers when no line is selected', () => {
      component.inputInfo = [dataset([{ x: T0, y: 12 }])];

      component.selectedDataLineIndex = -1;

      expect(annotations()['minPoint']).toBeUndefined();
      expect(annotations()['maxPoint']).toBeUndefined();
    });

    it('should not show markers when the selected line does not exist', () => {
      component.inputInfo = [dataset([{ x: T0, y: 12 }])];

      component.selectedDataLineIndex = 5;

      expect(annotations()['minPoint']).toBeUndefined();
    });

    it('should not show markers for an empty line', () => {
      component.inputInfo = [dataset([])];

      component.selectedDataLineIndex = 0;

      expect(annotations()['minPoint']).toBeUndefined();
    });
  });
});
