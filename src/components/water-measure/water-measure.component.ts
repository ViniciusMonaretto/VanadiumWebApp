import { Component, input, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphComponent } from '../graph/graph.component';
import { SensorModule } from '../../models/sensor-module';

/** Single reading point for the last-hour graph (x = timestamp ms, y = value) */
export interface WaterReadingPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'water-measure',
  templateUrl: './water-measure.component.html',
  styleUrls: ['./water-measure.component.scss'],
  imports: [CommonModule, GraphComponent],
  standalone: true
})
export class WaterMeasureComponent implements OnChanges {

  @Input() sensorInfo: SensorModule | null = null;
  /** Current daily consumption (e.g. liters/day) */
  @Input() currentDailyConsumption: number | null = null;
  /** Weekly consumption (e.g. liters/week) */
  @Input() weeklyConsumption: number | null = null;
  /** Monthly consumption (e.g. liters/month) */
  @Input() monthlyConsumption: number | null = null;
  /** Last month's consumption (e.g. liters) */
  @Input() lastMonthConsumption: number | null = null;

  /** Display unit (e.g. L, m³) */
  @Input() unit: string = 'L';

  /** Last hour of readings for the graph. When a new reading arrives, parent should append { x: timestampMs, y: value } and trim to last hour, then pass updated array. */
  @Input() lastHourReadings: WaterReadingPoint[] = [];

  /** Cached graph input; only updated when lastHourReadings changes so the graph setter doesn't run every change detection. */
  graphInputInfo: { label: string; 
    data: WaterReadingPoint[]; 
    borderColor: string; 
    backgroundColor: string;
    tension: number;
    realName: string;
   }[] = [{ label: 'Leituras', data: [], borderColor: '', backgroundColor: '', tension: 0.3, realName: '' }];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lastHourReadings']) {
      if (this.sensorInfo)
      {
        this.graphInputInfo = [{ label: 'Leituras',
          data: this.lastHourReadings ?? [],
          borderColor: this.sensorInfo.color,
          backgroundColor: this.sensorInfo.color + '0A',
          tension: 0.3,
          realName: this.sensorInfo.name, }];
      }
    }
  }

  formatValue(value: number | null): string {
    if (value === null || value === undefined) return '--';
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
