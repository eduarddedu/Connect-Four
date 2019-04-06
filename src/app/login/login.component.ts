import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

declare const FB: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  constructor(private router: Router, private auth: AuthService) {
  }

  ngOnInit() {
    this.auth.userSignIn.subscribe(() => setTimeout(() => this.router.navigate(['/']), 0));
  }

  openFBLogin() {
    FB.login();
  }
}

