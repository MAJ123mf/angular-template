import { Component, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './components/menu/menu.component';
import { ParcelFormComponent } from './components/forms/parcel-form/parcel-form.component';
import { ParcelTableComponent } from './components/tables/parcel-table/parcel-table.component';
import { BuildingFormComponent } from './components/forms/building-form/building-form.component';
import { BuildingTableComponent } from './components/tables/building-table/building-table.component';
import { RoadFormComponent } from './components/forms/road-form/road-form.component';
import { RoadTableComponent } from './components/tables/road-table/road-table.component';
import { AddressTableComponent } from './components/tables/address-table/address-table.component';
import { AddressFormComponent } from './components/forms/address-form/address-form.component';
import { MapComponent } from './components/map/map.component';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginFormComponent } from './components/forms/login-form/login-form.component';
import { MapService } from './services/map.service';
import { GeoService } from './services/geo.service';
import { TranslateModule } from '@ngx-translate/core';  // dodano za večjezičnost
import { LanguageService } from './services/language.service';  // dodano za večjezičnost


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    MenuComponent,
    ParcelFormComponent,
    ParcelTableComponent,
    BuildingFormComponent,
    BuildingTableComponent,
    RoadFormComponent,
    RoadTableComponent,
    AddressTableComponent,
    AddressFormComponent,
    MapComponent,
    TranslateModule    // dodano za večjezičnost
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(ParcelTableComponent) parcelTable!: ParcelTableComponent;
  @ViewChild(ParcelFormComponent) parcelForm!: ParcelFormComponent;
  @ViewChild(BuildingTableComponent) buildingTable!: BuildingTableComponent;
  @ViewChild(BuildingFormComponent) buildingForm!: BuildingFormComponent;  
  @ViewChild(RoadTableComponent) roadTable!: RoadTableComponent;
  @ViewChild(RoadFormComponent) roadForm!: RoadFormComponent;
  @ViewChild(AddressTableComponent) addressTable!: AddressTableComponent;
  @ViewChild(AddressFormComponent) addressForm!: AddressFormComponent;
  title = 'web';
  leftWidth = 40;
  topHeight = 60;
  private isResizingX = false;
  private isResizingY = false;
  helpVisible = false;  // Dodano za prikaz pomoči


  constructor(
    public authService: AuthService, 
    private router: Router,
    private dialog: MatDialog,
    private mapService: MapService,
    private geoService: GeoService,
    public languageService: LanguageService   // dodano za večjezičnost
   ) {}
  statusText = '';


@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  console.log('[App.Component.ts], Key Pressed? ', event.key, 'alt:', event.altKey, 'shift:', event.shiftKey);

  if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    console.log('[App.Component.ts]] Alt + Shift + e detected!');
    this.downloadGpkg();
  }

  // Alt + F1 → overlay okno
  if (event.altKey && event.key === 'F1') {
    event.preventDefault();
    console.log('[App.Component.ts] Alt + F1 detected!');
    this.helpVisible = !this.helpVisible;
  }

  // F1 (Fn + F1 na prenosniku) → uporabniška navodila v novem tabu
  if (!event.altKey && !event.shiftKey && !event.ctrlKey && event.key === 'F1') {
    event.preventDefault();
    console.log('[App.Component.ts] F1 detected!');
    window.open('uporabniska_navodila/index.html', '_blank');
  }
}

showHelp() {
  this.helpVisible = !this.helpVisible;
} 


  @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
      if (this.isResizingX) {
        const containerWidth = window.innerWidth;
        const newWidth = (event.clientX / containerWidth) * 100;
        if (newWidth > 10 && newWidth < 90) this.leftWidth = newWidth;
      }

      if (this.isResizingY) {
        const containerHeight = window.innerHeight;
        const newHeight = (event.clientY / containerHeight) * 100;
        if (newHeight > 10 && newHeight < 90) this.topHeight = newHeight;
      }
  }


  @HostListener('document:mouseup')
    stopResize() {
      this.isResizingX = false;
      this.isResizingY = false;
    }


  startResizeX(event: MouseEvent) {
    this.isResizingX = true;
    event.preventDefault();
  }

  startResizeY(event: MouseEvent) {
    this.isResizingY = true;
    event.preventDefault();
  }
  

  downloadGpkg() {
    this.geoService.downloadGeoPackage().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'podatki.gpkg';
        a.click();
        window.URL.revokeObjectURL(url);
        this.statusText = "Zbirka je med prenosi!";
      },
      error: (err) => {
        console.error('Napaka pri prenosu GeoPackage:', err);
        this.statusText = "Napaka pri prenosu zbirke!";
      }
    });
  }


  updateStatus(message: string) {
    this.statusText = message;
  }

  selectedType: 'parcel' | 'building' | 'road' | 'address' = 'parcel';


  ngOnInit(): void {
    this.languageService.init();               // dodano za večjezičnost inicializacija jezika

    this.authService.statusMessage$.subscribe(message => {
      this.statusText = message;
    });
    this.authService.statusMessage$.subscribe(message => {
        this.statusText = message;
    });
    this.authService.checkIsLoggedInInServer().subscribe();
  }


  openLoginDialog(): void {
    this.dialog.open(LoginFormComponent, {
      disableClose: true,
    });
  }


  switchForm(module: 'parcel' | 'building' | 'road' | 'address') {
    console.log('Preklapljam:', module);
    this.selectedType = module;
  }

  refreshTable() {
    if (this.selectedType === 'parcel') {
      this.parcelTable?.loadParcels();
    }
    if (this.selectedType === 'building') {
      this.buildingTable?.loadBuildings();
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
    this.selectedType = 'parcel';
    this.parcelForm.setUpdate(parcel);
    this.mapService.highlightParcelOnMap(parcel);
  }

  handleEditBuilding(building: any) {
    console.log('Building selected for edit:', building);
    this.selectedType = 'building';
    this.buildingForm.setUpdate(building);
    this.mapService.highlightBuildingOnMap(building);    
  }  

  handleEditRoad(road: any) {
    console.log('Road selected for edit:', road);
    this.selectedType = 'road';
    this.roadForm.setUpdate(road);
    this.mapService.highlightRoadOnMap(road); 
  }

  handleEditAddress(address: any) {
    console.log('Address selected for edit:', address);
    this.selectedType = 'address';
    this.addressForm.setUpdate(address);
    this.mapService.highlightAddressOnMap(address); 
  }
}
