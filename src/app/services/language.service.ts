import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly STORAGE_KEY = 'geosg_language';
  
  availableLanguages = [
    { code: 'sl', label: 'SL', flag: '🇸🇮' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'es', label: 'ESP', flag: '🇪🇸' }
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
    return this.translate.currentLang || 'sl';  // prečrtano, ker v naslednjih verzijah gre iz uporabe.
  }

  instant(key: string): string {
    return this.translate.instant(key);
  }

  // dodano za prevode slojev
  get onLangChange() {
    return this.translate.onLangChange;
  }
}
