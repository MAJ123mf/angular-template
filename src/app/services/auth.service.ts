// ------------------------------------------------------------------------------
// je profesorjev servis, ki se uporablja za ugotavljanje ali smo logirani ali ne.
// klicanj je iz login forme.
// -------------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ServerAnswerModel } from '../models/server-answer.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public username: string = '';
  public isAuthenticated: boolean = false;
  public userGroups: string[] = [];
  constructor(public apiService: ApiService) {
    this.checkIsLoggedInInServer();
  }
  // checkIsLoggedInInServer() {
  //     console.log('[AuthService] Checking login status...');
  //     this.apiService.post('core/isloggedin/', {}).subscribe({
  //             next: (response: ServerAnswerModel) => {
  //               console.log('[AuthService] Response:', response);
  //               if (response.ok){
  //                   this.username = response.data[0]['username']; 
  //                   this.isAuthenticated = true;
  //                   console.log('[AuthService] Logged in as:', this.username);
  //               } else {
  //                   console.log('[AuthService] Not logged in');
  //               }
  //             },
  //             error: (error:any)=>{
  //               console.log(error.description)
  //             }
  //           })//subscribe
  // }

  checkIsLoggedInInServer(): Observable<any> {
    console.log('[AuthService] Checking login status...');
    return this.apiService.get('core/check-login/').pipe(
      tap(response => {
        console.log('[AuthService] Response:', response);
        if (response.ok) {
          this.username = response.data[0]?.username || '';
          this.userGroups = response.data[0]?.groups || [];
          this.isAuthenticated = true;
          console.log('[AuthService] Logged in as:', this.username);
        } else {
          this.username = '';
          this.userGroups = [];
          this.isAuthenticated = false;
          console.log('[AuthService] Not logged in');
        }
      })
    );
  }



}