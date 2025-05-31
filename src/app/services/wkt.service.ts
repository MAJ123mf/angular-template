import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WktService {
  private wktSubject = new BehaviorSubject<string>('');
  wkt$ = this.wktSubject.asObservable();

  sendWkt(wkt: string): void {
    this.wktSubject.next(wkt);
  }

  getWkt() {
    return this.wkt$;
  }
}