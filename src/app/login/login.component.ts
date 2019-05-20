import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

declare const FB: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {

  constructor(router: Router, auth: AuthService) {
    auth.signin.subscribe(() => router.navigate(['/']));
  }

  openFBLogin() {
    FB.login();
  }
}

