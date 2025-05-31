import { Component } from '@angular/core';
//To use forms 
//  Import in the imports on the component the following

import { MatButtonModule } from '@angular/material/button';

//To use the controls in the component
//  Import in the imports on the component the following
import { ServerAnswerModel } from '../../../models/server-answer.model';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-logout-form',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './logout-form.component.html',
  styleUrl: './logout-form.component.scss'
})
export class LogoutFormComponent {
  serverMessage = '';
  constructor(private apiService:ApiService, private authService: AuthService){}
  logout(){
    this.apiService.post('core/logout/', {}).subscribe({
          next: (response: ServerAnswerModel) => {
            if (response.ok){
              this.authService.username = '';
              this.authService.isAuthenticated = false;
            }
            this.serverMessage=response.message;
          },
          error: (error:any)=>{
            console.log(error.description)
            this
          }
        })//subscribe
  }

}