import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './components/menu/menu.component';
import { ParcelFormComponent } from './components/forms/parcel-form/parcel-form.component';
import { ParcelTableComponent } from './components/tables/parcel-table/parcel-table.component';
import { RoadFormComponent } from './components/forms/road-form/road-form.component';
import { RoadTableComponent } from './components/tables/road-table/road-table.component';
import { AddressTableComponent } from './components/tables/address-table/address-table.component';
import { AddressFormComponent } from './components/forms/address-form/address-form.component';
import { MapComponent } from './components/map/map.component';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginFormComponent } from './components/forms/login-form/login-form.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    MenuComponent,
    ParcelFormComponent,
    ParcelTableComponent,
    RoadFormComponent,
    RoadTableComponent,
    AddressTableComponent,
    AddressFormComponent,
    MapComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(ParcelTableComponent) parcelTable!: ParcelTableComponent;
  @ViewChild(ParcelFormComponent) parcelForm!: ParcelFormComponent;
  @ViewChild(RoadTableComponent) roadTable!: RoadTableComponent;
  @ViewChild(RoadFormComponent) roadForm!: RoadFormComponent;
  @ViewChild(AddressTableComponent) addressTable!: AddressTableComponent;
  @ViewChild(AddressFormComponent) addressForm!: AddressFormComponent;
  title = 'web';


  constructor(
    public authService: AuthService, 
    private router: Router,
    private dialog: MatDialog 
  ) {}
  statusText = '';

  updateStatus(message: string) {
    this.statusText = message;
  }

  selectedType: 'parcel' | 'road' | 'address' = 'parcel';




  // Če hočemo prijavo na začetku odkomentiramo, sicer lahko delamo tudi brez prijave
  ngOnInit(): void {
    this.authService.statusMessage$.subscribe(message => {      // Za sporočila iz authService  (kdo je prijavljen s kakšnimi pravicami)
      this.statusText = message;
    });
    //  TO SPODAJ ODKOMENTIRAMO, če želimo prijavo takoj na začetku
    // this.authService.checkIsLoggedInInServer().subscribe(() => {
    //   if (!this.authService.isAuthenticated) {
    //     this.dialog.open(LoginFormComponent, {
    //       disableClose: true
    //     });
    //   } else {
    //     console.log('[AppComponent] Uporabnik je že prijavljen:', this.authService.username);
    //   }
    // });
    this.authService.statusMessage$.subscribe(message => {
        this.statusText = message;
      });

    // Ob vsakem zagonu preverimo, ali je prijavljen uporabnik (prek Django seje)
    this.authService.checkIsLoggedInInServer().subscribe();
  }


  openLoginDialog(): void {
    this.dialog.open(LoginFormComponent, {
      disableClose: true, // Ne dovoli zapreti brez prijave
    });
  }



  switchForm(module: 'parcel' | 'road' | 'address') {                     // v module je izbira !
    console.log('Preklapljam:', module); // Dodaj to vrstico za debug      // izbilo izpišem na conolo
    this.selectedType = module;
  }

  refreshTable() {
    if (this.selectedType === 'parcel') {
      this.parcelTable?.loadParcels();
    }
    if (this.selectedType === 'road') {
      this.roadTable?.loadRoads();
    }
    if (this.selectedType === 'address') {
      this.addressTable?.loadAddresses();
    }
  }

  handleEditParcel(parcel: any) {
    console.log('Parcel selected for edit:', parcel);
    this.selectedType = 'parcel';  // prikazujemo obrazec za urejanje parcele
    this.parcelForm.setUpdate(parcel);  // nastavimo podatke v obrazcu
  }

  handleEditRoad(road: any) {
    console.log('Road selected for edit:', road);
    this.selectedType = 'road';  // prikazujemo obrazec za urejanje ceste (road)
    this.roadForm.setUpdate(road);  // nastavimo podatke v obrazcu
  }

  handleEditAddress(address: any) {
    console.log('Address selected for edit:', address);
    this.selectedType = 'address';  // prikazujemo obrazec za urejanje naslovov (address)
    this.addressForm.setUpdate(address);  // nastavimo podatke v obrazcu
  }
}