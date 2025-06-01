import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddressService } from '../../../services/address.service';
import { DrawModeService } from '../../../services/draw-mode.service';
import { Address } from '../../../models/address';
import { ChangeDetectorRef } from '@angular/core';
import { WktGeometryTransferService } from '../../../services/wkt-geometry-transfer.service'; 
import { Subscription } from 'rxjs';
import { Inject } from '@angular/core';
import { NgZone } from '@angular/core'; // to služi za temu, da se izognemo napaki "ExpressionChangedAfterItHasBeenCheckedError" pri Angularju


@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss'
})
export class AddressFormComponent {
   @Output() saved = new EventEmitter<void>();
   @Output() statusMessage = new EventEmitter<string>();

   address: Address = new Address(0, 0, '', '', 0, '', '');  // inicializiramo address objekt
   private wktSubscription!: Subscription;         // prijavimo se na WktService, če se zgodi sprememba geom_wkt iz

  constructor(
     private addressService: AddressService,       // servis za komunikacijo z backendom
     private drawModeService: DrawModeService,    // za brisanje forme
     private cdRef: ChangeDetectorRef,           // za zaznavanje sprememb v Document Object Model (DOM) (Liflet karta)
     @Inject(WktGeometryTransferService) private wktService: WktGeometryTransferService, // Za prenos WKT grafike  
     private ngZone: NgZone
   ) {}

  ngOnInit(): void {
     this.wktSubscription = this.wktService.getGeometryUpdates().subscribe((payload) => {
      if (payload.type === 'address') {
        console.log('ParcelFormComponent prejel WKT:', payload.wkt);
        this.address.geom_wkt = payload.wkt;

        setTimeout(() => this.cdRef.detectChanges(), 0);
      }
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
  console.log('Address data za knjiženje:', this.address);  
  // Pripravi objekt za pošiljanje, kjer geom vzamemo iz geom_wkt
  const payload = {
    building_num: this.address.building_num,
    street: this.address.street,
    house_num: this.address.house_num,
    post_num: this.address.post_num, 
    post_name: this.address.post_name, 
    geom: this.address.geom_wkt    // ključ "geom" s podatkom iz geom_wkt
  };

  this.addressService.save(payload).subscribe({
    next: (res) => {
      // Prikaži backendovo message polje, če obstaja
      this.statusMessage.emit(JSON.stringify(res));          // dejansko sporočilo od Django
      console.log(res);
      this.clearForm();
      this.saved.emit();
    },
    error: (err) => {
      this.statusMessage.emit(JSON.stringify(err.error));    // dejansko sporočilo od Django
    }
  });
}

updateRecords() {
  const payload = {
    building_num: this.address.building_num,
    street: this.address.street,
    house_num: this.address.house_num,
    post_num: this.address.post_num, 
    post_name: this.address.post_name, 
    geom: this.address.geom_wkt    // ključ "geom" s podatkom iz geom_wkt
  };

  this.addressService.update(this.address.id, payload).subscribe({
    next: (res) => {
      this.statusMessage.emit(res?.message ||'Address updated successfully');
      this.clearForm();
      this.saved.emit();
    },
    error: (err) => {
      this.statusMessage.emit(JSON.stringify(err.error));
    }
  });
}

  setUpdate(data: Partial<Address>): void {
    this.address = new Address(
      data.id ?? 0,
      data.building_num ?? 0,
      data.street ?? '',
      data.house_num ?? '',
      data.post_num ?? 0,
      data.post_name ?? '',
      data.geom_wkt ?? data.geom ?? ''
    );
  }

  public clearForm(): void {     // public, zato, ker jo kličemo tudi iz html, privatne lahko kličem samo v istem fajlu!
    this.address = new Address(0, 0, '', '', 0, '', '');
  }

  onWktChange(wkt: string): void {
    alert('Funkcija se kliče');
    console.log('Prejel WKT iz mape:', wkt);
    this.address.geom_wkt = wkt;
  }


}