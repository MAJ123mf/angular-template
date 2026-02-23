import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ServerAnswerModel } from '../../../models/server-answer.model';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-logout-form',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './logout-form.component.html',
  styleUrl: './logout-form.component.scss'
})
export class LogoutFormComponent {
  serverMessage = '';
  constructor(
    private router: Router, 
    private apiService:ApiService, 
    private authService: AuthService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<LogoutFormComponent>
  ){
      // Ob spremembi jezika osveži sporočilo če smo odjavljeni
      this.translate.onLangChange.subscribe(() => {
        if (!this.authService.isAuthenticated) {
          this.authService.statusMessageSubject.next(
            this.translate.instant('AUTH_NOT_LOGGED_IN')
          );
      }
    });
   }

  logout(){
    console.log('[Logout] Logout triggered');
    this.apiService.post('core/logout/', {}).subscribe({
          next: (response: ServerAnswerModel) => {
            console.log('[Logout] Server response:', response);
            if (response.ok){
              this.authService.username = '';
              this.authService.isAuthenticated = false;
              this.authService.userGroups = [];
              console.log('[Logout] Uporabnik odjavljen !');

              // nastavi sporočilo PRED checkIsLoggedInInServer
              this.authService.statusMessageSubject.next(this.translate.instant('AUTH_NOT_LOGGED_IN'));
              
              this.dialogRef.close();

              // pokliči ZADNJI ker bi sicer prepisal sporočilo
              // this.authService.checkIsLoggedInInServer();
            }
            this.serverMessage=response.message;
          },
          error: (error:any)=>{
            console.error('[Logout] Napaka pri odjavi:', error.description);
          }
        })
  }
}