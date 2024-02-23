import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OpenStreetMapComponent } from './open-street-map/open-street-map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OpenStreetMapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'wind-turbine';
  toggle: boolean = false;

  toggleMenu() {
    this.toggle = !this.toggle;
  }

  hello() {
    return 'Ibrahim';
  }
}
