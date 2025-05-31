import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MapService } from '../../services/map.service';

import {Draw} from 'ol/interaction';
import { DrawEvent } from 'ol/interaction/Draw';
import {WKT} from 'ol/format';
import VectorSource from 'ol/source/Vector';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EventModel } from '../../models/event.model';

@Component({
  selector: 'app-draw-building',
  standalone: true,
  imports: [MatIconModule, MatTooltip],
  templateUrl: './draw-building.component.html',
  styleUrl: './draw-building.component.scss'
})
export class DrawBuildingComponent implements AfterViewInit, OnDestroy{
  drawMode: boolean = false;
  drawBuilding: Draw | undefined;

  constructor(public mapService: MapService, public router: Router, public eventService: EventService) {
    // Subscribe to events if needed
    this.eventService.eventActivated$.subscribe((event: EventModel) => {
      console.log("Event received in DrawBuildingComponent:", event.type);
      if (event.type != 'drawBuildingActivated') {
        this.drawMode = false; // Reset draw mode if a different event is received
      }
      // Handle the event as needed
    });
  }

  ngAfterViewInit(): void {
    console.log("DrawBuildingComponent initialized");
    this.addDrawBuildingInteraction();
    this.disableDrawBuildings();
    this.reloadBuildingsWmsLayer();
  }

  toggleDrawMode(){
    this.drawMode = !this.drawMode;
    if(this.drawMode){
      // Start drawing mode
      this.enableDrawBuildings();
      console.log("Drawing mode activated");
    } else {
      // Stop drawing mode
      this.disableDrawBuildings();
      this.clearVectorLayer();
      this.reloadBuildingsWmsLayer();
      console.log("Drawing mode deactivated");
    }
  }
  addDrawBuildingInteraction() {
    //Add the draw interaction when the component is initialized
    var sourceBuildings: VectorSource = this.mapService.getLayerByTitle('Buildings vector')?.getSource();
    if(sourceBuildings){
	    this.drawBuilding = new Draw({
         source: sourceBuildings, //source of the layer where the poligons will be drawn
        type: ('Polygon') //geometry type
      });
      this.drawBuilding.on('drawend', this.manageDrawEnd);
	
	    //adds the interaction to the map. This must be done only once
      this.mapService.map!.addInteraction(this.drawBuilding);
    }else{
      console.error("Error: Buildings layer not found");
    }
  }

  //Enables the polygons draw
  enableDrawBuildings(){
    this.mapService.disableMapInteractions(); // Disable other interactions
    this.drawBuilding!.setActive(true);
    this.eventService.emitEvent(new EventModel('drawBuildingActivated', {}));
  }

  //Disables the polygons draw
  disableDrawBuildings(){
    this.drawBuilding!.setActive(false);
  }

  //Enables clear the vector layer
  clearVectorLayer(){
    this.mapService.getLayerByTitle('Buildings vector')?.getSource().clear();
  }
  //Reload Buildings WMS Layer
  reloadBuildingsWmsLayer(){
    this.mapService.getLayerByTitle('Buildings WMS')?.getSource().updateParams({"time": Date.now()})
  }

  /**
   * Function which is executed each time that a polygon is finished of draw
   * Inside the e object is the geometry drawed.
   * 
   * IMPORTANT
   * It is an arow fuction in order to 'this' refer to the component class
   * and to have access to the router
   * */
  manageDrawEnd = (e: DrawEvent) => {
    var feature = e.feature;//this is the feature that fired the event
    var wktFormat = new WKT();//an object to get the WKT format of the geometry
    var wktRepresentation  = wktFormat.writeGeometry(feature.getGeometry()!);//geomertry in wkt
    console.log(wktRepresentation);//logs a message
    this.router.navigate(['/building-form'], { queryParams: {geom: wktRepresentation }});

  }

  ngOnDestroy(): void {
    // Remove the draw interaction when the component is destroyed
    if (this.drawBuilding) {
      this.mapService.map?.removeInteraction(this.drawBuilding);
      console.log("Draw interaction removed");
    }
  }
}