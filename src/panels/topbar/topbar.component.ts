import { Component, Input } from '@angular/core';
import { LucideAngularModule, Calendar, MapPin, Building } from 'lucide-angular';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @Input() date!: string;
  @Input() location!: string;
  @Input() company!: string;

  Calendar = Calendar;
  MapPin = MapPin;
  Building = Building;
}
