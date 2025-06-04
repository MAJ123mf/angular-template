import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcelService } from '../../../services/parcel.service';
import { DrawModeService } from '../../../services/draw-mode.service';
import { Parcel } from '../../../models/parcel';
import { ChangeDetectorRef } from '@angular/core';
import { WktGeometryTransferService } from '../../../services/wkt-geometry-transfer.service'; 
import { Subscription } from 'rxjs';
import { Inject } from '@angular/core';
import { NgZone } from '@angular/core';
import { EventService } from '../../../services/event.service';
import { EventModel } from '../../../models/event.model';

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
export class ParcelFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() statusMessage = new EventEmitter<string>();

  parcel: Parcel = new Parcel(0, '', '', 0, '', '');
  private wktSubscription!: Subscription;

  constructor(
    private parcelService: ParcelService,
    private drawModeService: DrawModeService,
    private cdRef: ChangeDetectorRef,
    public eventService: EventService,
    @Inject(WktGeometryTransferService) private wktService: WktGeometryTransferService, // Za prenos WKT grafike
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // WKT iz storitve
    this.wktSubscription = this.wktService.getGeometryUpdates().subscribe((payload) => {
      if (payload.type === 'parcel') {
        console.log('[Parcel-form] ParcelFormComponent prejel WKT:', payload.wkt);
        this.parcel.geom_wkt = payload.wkt;
        setTimeout(() => this.cdRef.detectChanges(), 0);
      }
    });

    // Dogodek iz eventService
    this.eventService.eventActivated$.subscribe(event => {
      if (event.type === 'parcel-selected') {
        console.log('[Parcel-form] Prejel parcel-selected event:', event.data);
        this.parcel.geom_wkt = event.data;
        setTimeout(() => this.cdRef.detectChanges(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wktSubscription) {
      this.wktSubscription.unsubscribe();
    }
  }

  saveRecords() {
    console.log('[Parcel-form] Parcel data za knjiženje:', this.parcel);
    const payload = {
      parc_st: this.parcel.parc_st,
      sifko: this.parcel.sifko,
      area: this.parcel.area,
      geom: this.parcel.geom_wkt
    };

    this.parcelService.save(payload).subscribe({
      next: (res) => {
        this.statusMessage.emit(JSON.stringify(res));
        console.log('[Parcel-form] Django response: ', res);
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
      geom: this.parcel.geom_wkt
    };

    this.parcelService.update(this.parcel.id, payload).subscribe({
      next: (res) => {
        this.statusMessage.emit(res?.message || 'Parcel updated successfully');
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

  public clearForm(): void {
    this.parcel = new Parcel(0, '', '', 0, '', '');
  }

  onWktChange(wkt: string): void {
    alert('Funkcija se kliče');
    console.log('[Parcel-form] Prejel WKT iz mape:', wkt);
    this.parcel.geom_wkt = wkt;
  }
}