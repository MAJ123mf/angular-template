import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
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
  checkIsLoggedInInServer() {
      console.log('[AuthService] Checking login status...');
      this.apiService.post('core/isloggedin/', {}).subscribe({
              next: (response: ServerAnswerModel) => {
                console.log('[AuthService] Response:', response);
                if (response.ok){
                    this.username = response.data[0]['username']; 
                    this.isAuthenticated = true;
                    console.log('[AuthService] Logged in as:', this.username);
                } else {
                    console.log('[AuthService] Not logged in');
                }
              },
              error: (error:any)=>{
                console.log(error.description)
              }
            })//subscribe
  }
}