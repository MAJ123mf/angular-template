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
  selector: 'app-draw-road',
  standalone: true,
  imports: [MatIconModule, MatTooltip],
  templateUrl: './draw-road.component.html',
  styleUrl: './draw-road.component.scss'
})
export class DrawRoadComponent implements AfterViewInit, OnDestroy{
  drawMode: boolean = false;
  drawRoad: Draw | undefined;

  constructor(public mapService: MapService, public router: Router, public eventService: EventService) {
    // Subscribe to events if needed
    this.eventService.eventActivated$.subscribe((event: EventModel) => {
      console.log("Event received in DrawRoadComponent:", event.type);
      if (event.type != 'drawRoadActivated') {
        this.drawMode = false; // Reset draw mode if a different event is received
      }
      // Handle the event as needed
    });
  }

  ngAfterViewInit(): void {
    console.log("DrawRoadComponent initialized");
    this.addDrawRoadInteraction();
    this.disableDrawRoads();
    this.reloadRoadsWmsLayer();
  }

  toggleDrawMode(){
    this.drawMode = !this.drawMode;
    if(this.drawMode){
      // Start drawing mode
      this.enableDrawRoads();
      console.log("Drawing mode activated");
    } else {
      // Stop drawing mode
      this.disableDrawRoads();
      this.clearVectorLayer();
      this.reloadRoadsWmsLayer();
      console.log("Drawing mode deactivated");
    }
  }

  
  addDrawRoadInteraction() {
    //Add the draw interaction when the component is initialized
    var sourceRoads: VectorSource = this.mapService.getLayerByTitle('Roads vector')?.getSource();
    if(sourceRoads){
      this.drawRoad = new Draw({
         source: sourceRoads, //source of the layer where the poligons will be drawn
        type: ('LineString') //geometry type
      });
      this.drawRoad.on('drawend', this.manageDrawEnd);
  
      //adds the interaction to the map. This must be done only once
      this.mapService.map!.addInteraction(this.drawRoad);
    }else{
      console.error("Error: Roads layer not found");
    }
  }

  //Enables the polygons draw
  enableDrawRoads(){
    this.mapService.disableMapInteractions(); // Ko kliknemo draw roads, se morajo ostali gumbi ugasnit glej map service!
    this.drawRoad!.setActive(true);
    this.eventService.emitEvent(new EventModel('drawRoadActivated', {}));
  }

  //Disables the polygons draw
  disableDrawRoads(){
    this.drawRoad!.setActive(false);
  }

  //Enables clear the vector layer
  clearVectorLayer(){
    this.mapService.getLayerByTitle('Roads vector')?.getSource().clear();
  }
  //Reload Roads WMS Layer
  reloadRoadsWmsLayer(){
    this.mapService.getLayerByTitle('Roads WMS')?.getSource().updateParams({"time": Date.now()})
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
    this.router.navigate(['/road-form'], { queryParams: {geom: wktRepresentation }});

  }

  ngOnDestroy(): void {
    // Remove the draw interaction when the component is destroyed
    if (this.drawRoad) {
      this.mapService.map?.removeInteraction(this.drawRoad);
      console.log("Draw interaction removed");
    }
  }
}