import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly STORAGE_KEY = 'geosg_language';
  
  availableLanguages = [
    { code: 'sl', label: 'SL' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ESP' }
  ];

  constructor(private translate: TranslateService) {}

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'sl';
    this.translate.use(saved);
  }

  setLanguage(code: string) {
    this.translate.use(code);
    localStorage.setItem(this.STORAGE_KEY, code);
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang || 'sl';
  }
}