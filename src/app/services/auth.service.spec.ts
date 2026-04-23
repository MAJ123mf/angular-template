import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { SettingsService } from './settings.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockTranslate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post'], {
      settingsService: { API_URL: 'http://192.168.0.39:8000/' }
    });

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'use'], {
      onLangChange: { subscribe: jasmine.createSpy('subscribe') }
    });
    mockTranslate.instant.and.returnValue('Prijavljeni ste');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [
        AuthService,
        { provide: ApiService, useValue: mockApiService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: TranslateService, useValue: mockTranslate },
        SettingsService
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  // --- Začetno stanje ---

  it('naj bo ob zagonu odjavljen', () => {
    expect(authService.isAuthenticated).toBeFalse();
    expect(authService.username).toBe('');
    expect(authService.userGroups).toEqual([]);
  });

  // --- hasGroup() ---

  it('hasGroup(): vrne true, če je uporabnik v skupini "editors"', () => {
    authService.userGroups = ['editors'];
    expect(authService.hasGroup('editors')).toBeTrue();
  });

  it('hasGroup(): vrne true, če je v eni od navedenih skupin', () => {
    authService.userGroups = ['editors'];
    expect(authService.hasGroup('editors', 'admins')).toBeTrue();
  });

  it('hasGroup(): vrne false, če ni v nobeni skupini', () => {
    authService.userGroups = ['viewers'];
    expect(authService.hasGroup('editors', 'admins')).toBeFalse();
  });

  it('hasGroup(): vrne false, ko so userGroups prazni', () => {
    authService.userGroups = [];
    expect(authService.hasGroup('editors')).toBeFalse();
  });

  it('hasGroup(): primerjava je občutljiva na velikost (lowercase)', () => {
    authService.userGroups = ['editors'];
    expect(authService.hasGroup('Editors')).toBeFalse();
    expect(authService.hasGroup('editors')).toBeTrue();
  });

  // --- checkIsLoggedInInServer() ---

  it('checkIsLoggedInInServer(): nastavi isAuthenticated=true ob uspešnem odgovoru', (done) => {
    const mockOdgovor = {
      ok: true,
      data: [{ username: 'janez', groups: ['editors'] }]
    };
    mockApiService.get.and.returnValue(of(mockOdgovor));

    authService.checkIsLoggedInInServer().subscribe(() => {
      expect(authService.isAuthenticated).toBeTrue();
      expect(authService.username).toBe('janez');
      expect(authService.userGroups).toEqual(['editors']);
      done();
    });
  });

  it('checkIsLoggedInInServer(): nastavi isAuthenticated=false, če ok=false', (done) => {
    const mockOdgovor = { ok: false, data: [] };
    mockApiService.get.and.returnValue(of(mockOdgovor));

    authService.checkIsLoggedInInServer().subscribe(() => {
      expect(authService.isAuthenticated).toBeFalse();
      expect(authService.username).toBe('');
      done();
    });
  });

  it('checkIsLoggedInInServer(): pretvori skupino v lowercase', (done) => {
    const mockOdgovor = {
      ok: true,
      data: [{ username: 'meta', groups: ['ADMINS', 'Editors'] }]
    };
    mockApiService.get.and.returnValue(of(mockOdgovor));

    authService.checkIsLoggedInInServer().subscribe(() => {
      expect(authService.userGroups).toEqual(['admins', 'editors']);
      done();
    });
  });

  // --- ensureCanEdit() ---

  it('ensureCanEdit(): vrne true za admins', () => {
    authService.userGroups = ['admins'];
    expect(authService.ensureCanEdit()).toBeTrue();
  });

  it('ensureCanEdit(): vrne true za editors', () => {
    authService.userGroups = ['editors'];
    expect(authService.ensureCanEdit()).toBeTrue();
  });

  it('ensureCanEdit(): vrne false in odpre login za brez pravic', () => {
    authService.userGroups = ['viewers'];
    mockApiService.post.and.returnValue(of({}));

    const rezultat = authService.ensureCanEdit();

    expect(rezultat).toBeFalse();
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('ensureCanEdit(): odpre login dialog tudi ob napaki pri odjavi', () => {
    authService.userGroups = [];
    mockApiService.post.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    authService.ensureCanEdit();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  // --- logout() ---

  it('logout(): ponastavi username, isAuthenticated, userGroups', (done) => {
    authService.username = 'janez';
    authService.isAuthenticated = true;
    authService.userGroups = ['editors'];

    mockApiService.post.and.returnValue(of({}));

    authService.logout().subscribe(() => {
      expect(authService.username).toBe('');
      expect(authService.isAuthenticated).toBeFalse();
      expect(authService.userGroups).toEqual([]);
      done();
    });
  });
});
