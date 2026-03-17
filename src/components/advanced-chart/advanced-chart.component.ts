import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawingMode, GraphComponent } from "../graph/graph.component";


@Component({
  selector: 'app-advanced-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphComponent],
  templateUrl: './advanced-chart.component.html',
  styleUrls: ['./advanced-chart.component.css'],
})
export class AdvancedChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() dataSources: any;

  activeTool: 'zoom' | 'pan' = 'zoom';

  crosshairRefMode = false;
  referenceLinesModeVertical = false;
  referenceLinesModeHorizontal = false;

  clearRefLinesTrigger = false;
  resizeTrigger = false;

  defaultColors = [
    '#58a6ff', '#3fb950', '#f78166', '#d2a8ff',
    '#ffa657', '#79c0ff', '#56d364', '#ff7b72',
    '#e3b341', '#bc8cff',
  ];

  ngOnInit(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  ngAfterViewInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnDestroy(): void {}

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.crosshairRefMode = false;
      this.referenceLinesModeVertical = false;
      this.referenceLinesModeHorizontal = false;
    }
  }

  setTool(tool: 'zoom' | 'pan'): void {
    this.activeTool = tool;
  }

  toggleReferenceLinesModeVertical(): void {
    if (this.referenceLinesModeVertical) {
      this.referenceLinesModeVertical = false;
    } else {
      this.referenceLinesModeVertical = true;
      this.referenceLinesModeHorizontal = false;
      this.crosshairRefMode = false;
    }
  }

  toggleReferenceLinesModeHorizontal(): void {
    if (this.referenceLinesModeHorizontal) {
      this.referenceLinesModeHorizontal = false;
    } else {
      this.referenceLinesModeHorizontal = true;
      this.referenceLinesModeVertical = false;
      this.crosshairRefMode = false;
    }
  }

  toggleCrosshairRefMode(): void {
    if (this.crosshairRefMode) {
      this.crosshairRefMode = false;
    } else {
      this.crosshairRefMode = true;
      this.referenceLinesModeVertical = false;
      this.referenceLinesModeHorizontal = false;
    }
  }

  clearReferenceLines(): void {
    this.clearRefLinesTrigger = !this.clearRefLinesTrigger;
  }

  hasRefLines(): boolean {
    return this.crosshairRefMode || this.referenceLinesModeVertical || this.referenceLinesModeHorizontal;
  }

  resetZoom(): void {
    this.resizeTrigger = !this.resizeTrigger;
  }

  getDrawingMode(): DrawingMode {
    if (this.crosshairRefMode ) {
      return DrawingMode.Both;
    } else if (this.referenceLinesModeVertical) {
      return DrawingMode.Vertical;
    } else if (this.referenceLinesModeHorizontal) {
      return DrawingMode.Horizontal;
    } else {
      return DrawingMode.None;
    }
  }
}

