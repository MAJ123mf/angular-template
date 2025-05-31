import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MapService } from '../../services/map.service';
import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';

@Component({
  selector: 'app-draw-flower',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './draw-flower.component.html',
  styleUrl: './draw-flower.component.scss'
})
export class DrawFlowerComponent {
  constructor(public mapService:MapService, public eventService:EventService) {
    this.eventService.eventActivated$.subscribe((event:EventModel) => {
      console.log("Event received in DrawFlowerComponent:", event.type);
      if (event.type != 'drawFlowerActivated') {
        this.drawMode = false; // Reset draw mode if a different event is received
      }
    });
  }

  drawMode: boolean = false;
  
  toggleDrawMode() {
    this.drawMode = !this.drawMode;
    if (this.drawMode) {
      // Start drawing mode
      console.log("Drawing mode activated");
      // Add logic to enable drawing mode
      this.eventService.emitEvent(new EventModel('drawFlowerActivated', {}));
    } else {
      // Stop drawing mode
      console.log("Drawing mode deactivated");
      // Add logic to disable drawing mode
      this.mapService.disableMapInteractions();
    }
  }


}