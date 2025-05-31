import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core'; // dodaj OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoadService } from '../../../services/road.service';
import { DrawModeService } from '../../../services/draw-mode.service'; // za brisanje forme
import { Road } from '../../../models/roads';
import { ChangeDetectorRef } from '@angular/core';
import { WktService } from '../../../services/wkt.service';
import { Subscription } from 'rxjs';
import { NgZone } from '@angular/core'; // to služi za temu, da se izognemo napaki "ExpressionChangedAfterItHasBeenCheckedError" pri Angularju

@Component({
  selector: 'app-road-form',
  standalone: true,
  imports: [
     CommonModule, 
     FormsModule
  ],
  templateUrl: './road-form.component.html',
  styleUrl: './road-form.component.scss'
})
export class RoadFormComponent implements OnInit, OnDestroy {
   @Output() saved = new EventEmitter<void>();
   @Output() statusMessage = new EventEmitter<string>();

   road: Road = new Road(0, '', '', '', 0, '');
   private wktSubscription!: Subscription;

   constructor(
     private roadService: RoadService,
     private drawModeService: DrawModeService,   // za brisanje forme
     private cdRef: ChangeDetectorRef,
     private wktService: WktService,
     private ngZone: NgZone        // zaznava spremembe v geom_wkt, iz leaflet karte, ki je izven Angular konteksta
   ) {}

   ngOnInit(): void {
     this.wktSubscription = this.wktService.getWkt().subscribe((wkt: string) => {
       this.ngZone.run(() => {
         this.road.geom_wkt = wkt;
         this.cdRef.detectChanges();
       });
     });

   this.drawModeService.clearForm$.subscribe(() => {
      this.clearForm();
    });
}
    

   ngOnDestroy(): void {
     if (this.wktSubscription) {
       this.wktSubscription.unsubscribe();
     }
   }

   saveRecords() {
     console.log('Road data:', this.road);  
     const payload = {
       str_name: this.road.str_name,
       administrator: this.road.administrator,
       maintainer: this.road.maintainer,
       length: this.road.length,
       geom: this.road.geom_wkt
     };
     this.roadService.save(payload).subscribe({
       next: (res) => {
         this.statusMessage.emit(JSON.stringify(res));
         this.clearForm();
         this.saved.emit();
       },
       error: (err) => {
         this.statusMessage.emit(JSON.stringify(err.error));
       }
     });
   }

   updateRecords() {
     const payload = {
       str_name: this.road.str_name,
       administrator: this.road.administrator,
       maintainer: this.road.maintainer,
       length: this.road.length,
       geom: this.road.geom_wkt
     };
     this.roadService.update(this.road.id, payload).subscribe({
       next: (res) => {
         this.statusMessage.emit(JSON.stringify(res));;
         this.clearForm();
         this.saved.emit();
       },
       error: (err) => {
         this.statusMessage.emit(JSON.stringify(err.error));
       }
     });
   }

   setUpdate(data: Partial<Road>): void {
     this.road = new Road(
       data.id ?? 0,
       data.str_name ?? '',
       data.administrator ?? '',
       data.maintainer ?? '',
       data.length ?? 0,
       data.geom_wkt ?? data.geom ?? ''
     );
   }

   public clearForm(): void {
     this.road = new Road(0, '', '', '', 0, '');
   }

   onWktChange(wkt: string): void {
     alert('Funkcija se kliče');
     console.log('Prejel WKT iz mape:', wkt);
     this.road.geom_wkt = wkt;
   }
}

