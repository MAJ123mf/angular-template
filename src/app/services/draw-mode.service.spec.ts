import { TestBed } from '@angular/core/testing';
import { DrawModeService, DrawMode } from './draw-mode.service';
 
describe('DrawModeService', () => {
  let service: DrawModeService;
 
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DrawModeService]
    });
    service = TestBed.inject(DrawModeService);
  });
 
  // --- Začetno stanje ---
 
  it('naj bo privzeti način "parcel"', (done) => {
    service.currentMode$.subscribe(mode => {
      expect(mode).toBe('parcel');
      done();
    });
  });
 
  // --- setMode() ---
 
  it('naj nastavi način na "building"', (done) => {
    service.setMode('building');
    service.currentMode$.subscribe(mode => {
      expect(mode).toBe('building');
      done();
    });
  });
 
  it('naj nastavi način na "road"', (done) => {
    service.setMode('road');
    service.currentMode$.subscribe(mode => {
      expect(mode).toBe('road');
      done();
    });
  });
 
  it('naj nastavi način na "address"', (done) => {
    service.setMode('address');
    service.currentMode$.subscribe(mode => {
      expect(mode).toBe('address');
      done();
    });
  });
 
  it('naj oddaja novo vrednost ob vsakem klicu setMode()', () => {
    const prejeteVrednosti: DrawMode[] = [];
 
    const sub = service.currentMode$.subscribe(m => prejeteVrednosti.push(m));
 
    service.setMode('building');
    service.setMode('road');
 
    sub.unsubscribe();
 
    expect(prejeteVrednosti).toEqual(['parcel', 'building', 'road']);
  });
 
  // --- clearForm$ ---
 
  it('naj sproži clearForm$ ob vsakem klicu setMode()', () => {
    let steviloCiscenj = 0;
    service.clearForm$.subscribe(() => steviloCiscenj++);
 
    service.setMode('building');
    service.setMode('address');
 
    expect(steviloCiscenj).toBe(2);
  });
 
  it('naj ne sproži clearForm$ brez klica setMode()', () => {
    let steviloCiscenj = 0;
    service.clearForm$.subscribe(() => steviloCiscenj++);
 
    expect(steviloCiscenj).toBe(0);
  });
});