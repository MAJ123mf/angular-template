import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcelService } from '../../../services/parcel.service';
import { DrawModeService } from '../../../services/draw-mode.service';
import { Parcel } from '../../../models/parcel';
import { ChangeDetectorRef } from '@angular/core';
import { WktService } from '../../../services/wkt.service';
import { Subscription } from 'rxjs';
import { Inject } from '@angular/core';
import { NgZone } from '@angular/core'; // to služi za temu, da se izognemo napaki "ExpressionChangedAfterItHasBeenCheckedError" pri Angularju

@Component({
  standalone: true,
  selector: 'app-parcel-form',
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './parcel-form.component.html',
  styleUrls: ['./parcel-form.component.scss']
})
export class ParcelFormComponent {
   @Output() saved = new EventEmitter<void>();
   @Output() statusMessage = new EventEmitter<string>();

   parcel: Parcel = new Parcel(0, '', '', 0, '', '');  // inicializiramo parcel objekt
   private wktSubscription!: Subscription;         // prijavimo se na WktService, če se zgodi sprememba geom_wkt iz

  // ngAfterViewInit(): void {   // ta metoda se kliče po tem, ko je komponenta naložena
  //   console.log('ParcelFormComponent ready');  // samo za testiranje
  //}

   // constructor(private parcelService: ParcelService) {}
  constructor(
     private parcelService: ParcelService,       // servis za komunikacijo z backendom
     private drawModeService: DrawModeService,   // za brisanje forme
     private cdRef: ChangeDetectorRef,           // za zaznavanje sprememb v Document Object Model (DOM) (Liflet karta)
     @Inject(WktService) private wktService: WktService,  // komunikacija znotraj Angularja med komponentami, ker so v rzličnih frame
     private ngZone: NgZone
   ) {}

  ngOnInit(): void {
     this.wktSubscription = this.wktService.getWkt().subscribe((wkt: string) => {   // naročimo se na spremembe geom_wkt
       console.log('ParcelFormComponent prejel WKT:', wkt);
       this.parcel.geom_wkt = wkt;

       // Zakasnjen zagon po zaključku sprememb DOM-a
       setTimeout(() => this.cdRef.detectChanges(), 0);
     });
     this.drawModeService.clearForm$.subscribe(() => {      // naročimo se na spremembo ob zamenjavi forme. Forma se počisti
       this.clearForm();
     });
  }

  ngOnDestroy(): void {
    if (this.wktSubscription) {
      this.wktSubscription.unsubscribe();
    }
  }

  saveRecords() {
  console.log('Parcel data za knjiženje:', this.parcel);  
  // Pripravi objekt za pošiljanje, kjer geom vzamemo iz geom_wkt
  const payload = {
    parc_st: this.parcel.parc_st,
    sifko: this.parcel.sifko,
    area: this.parcel.area,
    geom: this.parcel.geom_wkt    // ključ "geom" s podatkom iz geom_wkt
  };

  this.parcelService.save(payload).subscribe({
    next: (res) => {
      // Prikaži backendovo message polje, če obstaja
      this.statusMessage.emit(JSON.stringify(res));          // dejansko sporočilo od Django
      console.log('Django response: ',res);
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
    parc_st: this.parcel.parc_st,
    sifko: this.parcel.sifko,
    area: this.parcel.area,
    geom: this.parcel.geom_wkt    // prav tako geom = geom_wkt
  };

  this.parcelService.update(this.parcel.id, payload).subscribe({
    next: (res) => {
      this.statusMessage.emit(res?.message ||'Parcel updated successfully');
      this.clearForm();
      this.saved.emit();
    },
    error: (err) => {
      this.statusMessage.emit(JSON.stringify(err.error));
    }
  });
}

  setUpdate(data: Partial<Parcel>): void {
    this.parcel = new Parcel(
      data.id ?? 0,
      data.parc_st ?? '',
      data.sifko ?? '',
      data.area ?? 0,
      data.geom_wkt ?? data.geom ?? ''
    );
  }

  public clearForm(): void {     // public, zato, ker jo kličemo tudi iz html, privatne lahko kličem samo v istem fajlu!
    this.parcel = new Parcel(0, '', '', 0, '', ''); // inicializiramo parcel objekt
  }

  onWktChange(wkt: string): void {
    alert('Funkcija se kliče');
    console.log('Prejel WKT iz mape:', wkt);
    this.parcel.geom_wkt = wkt;
  }


}