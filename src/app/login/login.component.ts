import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, User } from '../auth.service';

declare const FB: any;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  constructor(private router: Router, private zone: NgZone, private authService: AuthService) {

  }

  ngOnInit() {
    const navigateHome = () => this.zone.run(() => this.router.navigateByUrl('/'));
    if (this.authService.user !== null) {
      navigateHome();
    } else {
      this.authService.userSignIn.subscribe(() => navigateHome());
    }
    FB.Event.subscribe('xfbml.render', function () {
      const spinner = document.getElementById('spinner');
      if (spinner) {
        spinner.removeAttribute('style');
        spinner.removeChild(spinner.childNodes[0]);
      }
    });
  }
}

