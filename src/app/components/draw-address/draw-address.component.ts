import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MapService } from '../../services/map.service';
import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';
import { MatTooltip } from '@angular/material/tooltip';   // če hočeš da dela Tooltip ko se z miško postaviš na gumb na karti...

@Component({
  selector: 'app-draw-address',
  standalone: true,
  imports: [MatIconModule, MatTooltip],
  templateUrl: './draw-address.component.html',
  styleUrl: './draw-address.component.scss'
})
export class DrawAddressComponent {
  constructor(public mapService:MapService, public eventService:EventService) {
    this.eventService.eventActivated$.subscribe((event:EventModel) => {
      console.log("Event received in DrawAddressComponent:", event.type);
      if (event.type != 'drawAddressActivated') {
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
      this.eventService.emitEvent(new EventModel('drawAddressActivated', {}));
    } else {
      // Stop drawing mode
      console.log("Drawing mode deactivated");
      // Add logic to disable drawing mode
      this.mapService.disableMapInteractions();
    }
  }


}