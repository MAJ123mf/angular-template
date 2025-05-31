import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadService } from '../../../services/road.service';

@Component({
   selector: 'app-road-table',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './road-table.component.html',
   styleUrl: './road-table.component.scss'
})
export class RoadTableComponent implements OnInit {
   @Output() statusMessage = new EventEmitter<string>();    // za sporočila za statusno vrstico
   @Output() editRoad = new EventEmitter<any>();  // se sproži ob kliku na gumb "Uredi" v tabeli, pošlje road objekt v formo

  RoadsArray: any[] = [];
  izbira: 'all' | 'one' = 'all';  // spremenljivka za izbiro med vsemi parcelami ali eno parcelo
  inputId: number =1;  // spremenljivka za shranjevanje izbrane parcele


  constructor(private roadService: RoadService) {}

  ngOnInit() {
    this.loadRoads();
  }

  loadRoads() {                               // metoda za nalaganje cest, v odvisnosti od izbire, oz od radion gumbov
    if (this.izbira === 'all') {              // če nalaga vse ceste
      this.roadService.getAll().subscribe({   // getAll je metoda v road.service.ts
        next: (data: any[]) => {
          this.RoadsArray = data;
        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju cest:', error);
          this.statusMessage.emit('Napaka pri pridobivanju cest.');
        }
      });
    } else {                               // če nalaga eno cesto
      this.roadService.getOne(this.inputId).subscribe({               // getOne je metoda v road.service.ts
        next: (road: any) => {
          this.RoadsArray = [road];  // samo ena cesta v tabeli
        },
        error: (error: any) => {
          console.error('Napaka pri pridobivanju cest:', error);
          this.statusMessage.emit(`Cesta z ID=${this.inputId} ne obstaja.`);
          this.RoadsArray = [];  // počisti tabelo
        }
      });
    }
  }

  setIzbira(value: 'all' | 'one') {
    this.izbira = value;
    this.loadRoads();
  }

  onInputIdChange(event: any) {
    this.inputId = Number(event.target.value);
    if (this.izbira === 'one') {
      this.loadRoads();
    }
  }

  setUpdate(road: any) {      // ob kliku na gumb "Uredi" v tabeli se sproži ta metoda in pošlje road objekt v formo
    console.log('RoadTableComponent: setUpdate', road);  // za testiranje
    this.editRoad.emit(road);
  }

  setDelete(road: any) {                            // ob kliku na gumb "Izbriši" v tabeli se sproži ta metoda in izbriše road objekt
    this.roadService.delete(road.id).subscribe({
      next: () => {
        // Namesto alerta, ki odpre novo okno,  pošljemo raje sporočilo v statusno vrstico
        this.statusMessage.emit('Road deleted successfully');
        this.loadRoads();
      },
      error: (error) => {
        //console.error('Napaka pri brisanju ceste.', error);      // samo za testiranje
        this.statusMessage.emit('Error deleting road:');           // sporočilo za statusno vrstico
      }
    });
  }
}

