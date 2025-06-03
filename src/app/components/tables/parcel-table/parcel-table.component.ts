import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParcelService } from '../../../services/parcel.service';
import { MapService } from '../../../services/map.service'; 


@Component({
  standalone: true,
  selector: 'app-parcel-table',
  imports: [CommonModule],
  templateUrl: './parcel-table.component.html',
  styleUrls: ['./parcel-table.component.scss']
})
export class ParcelTableComponent implements OnInit {
  @Output() statusMessage = new EventEmitter<string>();
  @Output() editParcel = new EventEmitter<any>();

  ParcelsArray: any[] = [];
  izbira: 'all' | 'one' = 'all';  // spremenljivka za izbiro med vsemi parcelami ali eno parcelo
  inputId: number =1;  // spremenljivka za shranjevanje izbrane parcele


  constructor(
    private parcelService: ParcelService,
    private mapService: MapService
  ) {}

  ngOnInit() {
    this.loadParcels();
  }

  loadParcels() {
    if (this.izbira === 'all') {
      this.parcelService.getAll().subscribe({    // getAll je metoda v parcel.service.ts
        next: (data: any[]) => {
          this.ParcelsArray = data;
        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju parcel:', error);
          this.statusMessage.emit('Napaka pri pridobivanju parcel.');
        }
      });
    } else {
      this.parcelService.getOne(this.inputId).subscribe({       // getOne je metoda v parcel.service.ts
        next: (parcel: any) => {
          this.ParcelsArray = [parcel];  // samo ena parcela v tabeli
        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju parcele:', error);
          this.statusMessage.emit(`Parcela z ID=${this.inputId} ne obstaja.`);
          this.ParcelsArray = [];  // počisti tabelo
        }
      });
    }
  }

  setIzbira(value: 'all' | 'one') {
    this.izbira = value;
    this.loadParcels();
  }

  onInputIdChange(event: any) {
    this.inputId = Number(event.target.value);
    if (this.izbira === 'one') {
      this.loadParcels();
    }
  }

  setUpdate(parcel: any) {
    this.editParcel.emit(parcel);
  }

  setDelete(parcel: any) {
    this.parcelService.delete(parcel.id).subscribe({
      next: () => {
        // Namesto alerta pošljemo sporočilo v statusno vrstico
        this.statusMessage.emit('Parcel deleted successfully');
        this.loadParcels();
      },
      error: (error) => {
        console.error('Napaka pri brisanju parcele:', error);
        this.statusMessage.emit('Napaka pri brisanju parcele.');
      }
    });
  }

  drawParcelGeometry(parcel: any) {
    console.log('[drawParcelGeometry] Parcel:', parcel);
    if (!parcel?.geom_geojson) {
      console.warn('[drawParcelGeometry] geom_geojson manjka!');
      return;
    }
    this.mapService.addParcelsGeoJsonToLayer(parcel.geom_geojson);
  }

}
