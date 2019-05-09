import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CookieService } from '../cookie.service';

@Component({
  selector: 'app-policy-accept',
  templateUrl: './policy-accept.component.html',
  styleUrls: ['./policy-accept.component.css']
})
export class PolicyAcceptComponent implements OnInit {
  showComponent = true;
  readonly COOKIE_NAME = 'policy_accept';

  constructor(private router: Router, private cookieService: CookieService) { }

  ngOnInit() {
    const policyCookie = this.cookieService.getCookieValue(this.COOKIE_NAME);
    if (policyCookie) {
      this.showComponent = false;
    }
  }

  onClickAcceptBtn() {
    this.cookieService.setCookie(this.COOKIE_NAME, 'true', 365);
    this.showComponent = false;
  }

}
