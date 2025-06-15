
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddressService } from '../../../services/address.service';
import { MapService } from '../../../services/map.service'; 
import { AuthService } from '../../../services/auth.service';  // bomo preverjali če smo prijavljeni!
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-address-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-table.component.html',
  styleUrl: './address-table.component.scss'
})
export class AddressTableComponent implements OnInit {
   @Output() statusMessage = new EventEmitter<string>();    // za sporočila za statusno vrstico
   @Output() editAddress = new EventEmitter<any>();  // se sproži ob kliku na gumb "Uredi" v tabeli, pošlje address objekt v formo
   
   AddressArray: any[] = [];
   izbira: 'all' | 'one' = 'all';  // spremenljivka za izbiro med vsemi naslovi ali enim naslovom
   inputId: number =1;  // spremenljivka za shranjevanje izbranega naslova, na začetku je 2


  constructor(
    private addressService: AddressService,
    private mapService: MapService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    if (this.izbira === 'all') {
      this.addressService.getAll().subscribe({    // getAll je metoda v address.service.ts
        next: (data: any[]) => {
          console.log('Prejeti naslovi:', data);  
          this.AddressArray = data;

          this.mapService.addAddressesGeoJsonToLayer(data);

        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju naslova:', error);
          this.statusMessage.emit('Napaka pri pridobivanju naslova.');
        }
      });
    } else {
      this.addressService.getOne(this.inputId).subscribe({       // getOne je metoda v address.service.ts
        next: (address: any) => {
          this.AddressArray = [address];  // samo en naslov v tabeli

          this.mapService.addAddressesGeoJsonToLayer(address);

        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju naslovov:', error);
          this.statusMessage.emit(`Address z ID=${this.inputId} do not Exists.`);
          this.AddressArray = [];  // počisti tabelo
        }
      });
    }
  }

  setIzbira(value: 'all' | 'one') {
    this.izbira = value;
    this.loadAddresses();
  }

  onInputIdChange(event: any) {
    this.inputId = Number(event.target.value);
    if (this.izbira === 'one') {
      this.loadAddresses();
    }
  }

  setUpdate(address: any) {      // ob kliku na gumb "Uredi" v tabeli se sproži ta metoda in pošlje address objekt v formo
    console.log('AddressTableComponent: setUpdate', address);  // za testiranje
    this.editAddress.emit(address);
  }

  setDelete(address: any) {                            // ob kliku na gumb "Izbriši" v tabeli se sproži ta metoda in izbriše road objekt

    // preverimo ali imamo pravice za brisanje naslovov, torej ali smo v grupi editors ali admins
    if (!this.authService.ensureCanEdit()) {
      this.statusMessage.emit('You do not have permission to delete data.');
    return;
    }

    this.addressService.delete(address.id).subscribe({
      next: () => {
        // Namesto alerta, ki odpre novo okno,  pošljemo raje sporočilo v statusno vrstico
        this.statusMessage.emit('Address deleted successfully');
        this.loadAddresses();
      },
      error: (error) => {
        //console.error('Napaka pri brisanju ceste.', error);      // samo za testiranje
        this.statusMessage.emit('Error deleting address:');           // sporočilo za statusno vrstico
      }
    });
  }
}

