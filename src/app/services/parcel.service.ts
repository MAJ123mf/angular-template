import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Parcel } from '../models/parcel';  // prilagodi pot do modela

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private baseUrl   = 'http://localhost:8000/parcels/parcels/';
  private insertUrl = 'http://localhost:8000/parcels/parcels_view/insert2/';  
  private updateUrl = 'http://localhost:8000/parcels/parcels_view/update/';  

  constructor(private http: HttpClient) {}

  /** Pridobi vse parcele */
  getAll(): Observable<Parcel[]> {
    console.log('ParcelService: pridobivam vse parcele');
    return this.http.get<Parcel[]>(this.baseUrl).pipe(
      tap(parcels => console.log('Prejete parcele:', parcels))
    );
  }

  getOne(id: number): Observable<Parcel> {
     const url = `http://localhost:8000/parcels/parcels/${id}/`;
     console.log(`ParcelService: pridobivam parcelo z ID=${id}`);
     return this.http.get<Parcel>(url).pipe(
       tap(parcel => console.log('Prejeta posamezna parcela:', parcel))
    );
  }

  /** Shrani novo parcelo */
  save(parcel: {
    parc_st: string;
    sifko: string;
    area: number;
    geom: string;
  }): Observable<any> {
    console.log('ParcelService: shranjujem parcelo:', parcel);

    const body = new HttpParams()
      .set('parc_st', parcel.parc_st)
      .set('sifko', parcel.sifko)
      .set('area', parcel.area.toString())
      .set('geom', parcel.geom);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post(this.insertUrl, body.toString(), { headers }).pipe(
      tap(res => console.log('Odgovor po shranjevanju parcele:', res))
    );
  }

  /** Posodobi obstoječo parcelo */
  update(id: number, parcel: {
    parc_st: string;
    sifko: string;
    area: number;
    geom: string;
  }): Observable<any> {
    console.log(`ParcelService: posodabljam parcelo z ID=${id}`, parcel);
    return this.http.put(`${this.baseUrl}${id}/`, parcel).pipe(
      tap(res => console.log('Odgovor po posodobitvi parcele:', res))
    );
  }

  /** Izbriši parcelo */
  delete(id: number): Observable<any> {
    console.log(`ParcelService: brišem parcelo z ID=${id}`);
    return this.http.delete(`${this.baseUrl}${id}`);
  }
}