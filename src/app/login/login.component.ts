import { Component } from '@angular/core';

declare const FB: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {

  onClickFacebookLogin() {
    FB.login();
  }
}

