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
import { WktGeometryTransferService} from'../../services/wkt-geometry-transfer.service';
import { EventModel } from '../../models/event.model';

@Component({
  selector: 'app-draw-parcel',
  standalone: true,
  imports: [MatIconModule, MatTooltip],
  templateUrl: './draw-parcel.component.html',
  styleUrl: './draw-parcel.component.scss'
})
export class DrawParcelComponent implements AfterViewInit, OnDestroy{
  drawMode: boolean = false;
  drawParcel: Draw | undefined;

  // v konstruktorju imamo na primer WktGeometryTransfer service  (servis je najavljen tudi pod import)
  // parcel-form posluša ta service, sam servis najdeš seveda med servisi...
  // dejansko risanje pa se izvede na mapi
  constructor(private wktTransfer: WktGeometryTransferService, public mapService: MapService, public router: Router, public eventService: EventService) {
    // Subscribe to events if needed
    this.eventService.eventActivated$.subscribe((event: EventModel) => {
      console.log("[Drav-parcel] Event received in DrawParcelComponent:", event.type);
      if (event.type != 'drawParcelActivated') {
        this.drawMode = false; // Reset draw mode if a different event is received
      }
      // Handle the event as needed
    });
  }

  ngAfterViewInit(): void {
    console.log("DrawParcelComponent initialized");
    this.addDrawParcelInteraction();
    this.disableDrawParcels();
    this.reloadParcelsWmsLayer();
  }

  toggleDrawMode(){
    this.drawMode = !this.drawMode;
    if(this.drawMode){
      // Start drawing mode
      this.enableDrawParcels();
      console.log("[Drav-parcel] Drawing mode activated");
    } else {
      // Stop drawing mode
      this.disableDrawParcels();
      this.clearVectorLayer();
      this.reloadParcelsWmsLayer();
      console.log("[Drav-parcel] Drawing mode deactivated");
    }
  }


  addDrawParcelInteraction() {
    //Add the draw interaction when the component is initialized
    var sourceParcels: VectorSource = this.mapService.getLayerByTitle('Parcels vector')?.getSource();
    if(sourceParcels){
      this.drawParcel = new Draw({
         source: sourceParcels, //source of the layer where the poligons will be drawn
        type: ('Polygon') //geometry type
      });
      this.drawParcel.on('drawend', this.manageDrawEnd);
  
      //adds the interaction to the map. This must be done only once
      this.mapService.map!.addInteraction(this.drawParcel);
    }else{
      console.error("Error: Parcels layer not found");
    }
  }

  //Enables the polygons draw
  enableDrawParcels(){
    this.mapService.disableMapInteractions(); // Disable other interactions
    this.drawParcel!.setActive(true);
    this.eventService.emitEvent(new EventModel('drawParcelActivated', {}));
  }

  //Disables the polygons draw
  disableDrawParcels(){
    this.drawParcel!.setActive(false);
  }

  //Enables clear the vector layer
  clearVectorLayer(){
    this.mapService.getLayerByTitle('Parcels vector')?.getSource().clear();
  }
  //Reload Parcels WMS Layer
  reloadParcelsWmsLayer(){
    this.mapService.getLayerByTitle('Parcels WMS')?.getSource().updateParams({"time": Date.now()})
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
    console.log("[Drav-parcel]",wktRepresentation);//logs a message
    // Pošlji geometrijo preko servisa
    this.wktTransfer.sendGeometry('parcel', wktRepresentation);
    // this.router.navigate(['/form-parcel'], { queryParams: {geom: wktRepresentation }});
  }

  ngOnDestroy(): void {
    // Remove the draw interaction when the component is destroyed
    if (this.drawParcel) {
      this.mapService.map?.removeInteraction(this.drawParcel);
      console.log("[Drav-parcel] Draw interaction removed");
    }
  }
}