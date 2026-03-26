// ---------------------------------------------------------------------
// TO je servis za globalne nastavitve. Tu recimo imamo povezavo za 
// geoserver, ki jo potem uporabimo v map.service, ko podajamo url za 
// naš WMS servis.  Tu izberemo ali delamo z razvojnim ali produkcijskim okoljem
// ---------------------------------------------------------------------

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public mode=1;  // 1 for local, 2 for production

  public API_URL;
  public GEOSERVER_URL;
  public WEB_URL;
  constructor() { 
    if (this.mode== 1) {
      this.API_URL='http://192.168.0.39:8000/';
      this.GEOSERVER_URL='http://192.168.0.39:8080/geoserver/';
      this.WEB_URL='http://192.168.0.39:4200/';

    } else if (this.mode== 2) {
      this.API_URL='http://192.168.0.39/';
      this.GEOSERVER_URL='http://192.168.0.39/geoserver/';
      this.WEB_URL='http://192.168.0.39/';
    }
  }
}
