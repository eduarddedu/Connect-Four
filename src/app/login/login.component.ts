import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

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
    FB.Event.subscribe('xfbml.render', function () {
      const spinner = document.getElementById('spinner');
      if (spinner) {
        spinner.removeAttribute('style');
        spinner.removeChild(spinner.childNodes[0]);
      }
    });
  }
}

