import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  Decimation
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Same registration main.ts does at startup — specs don't load main.ts
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  Decimation,
  zoomPlugin
);
