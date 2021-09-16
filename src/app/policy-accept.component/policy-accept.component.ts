import { Component, OnInit } from '@angular/core';

import { CookieService } from '../services/cookie.service';

@Component({
  selector: 'app-policy-accept',
  templateUrl: './policy-accept.component.html',
  styleUrls: ['./policy-accept.component.css']
})
export class PolicyAcceptComponent implements OnInit {
  showComponent = true;
  private readonly POLICY_COOKIE_NAME = 'policy_accept';

  constructor(private cookieService: CookieService) { }

  ngOnInit() {
    if (this.cookieService.hasItem(this.POLICY_COOKIE_NAME)) {
      this.showComponent = false;
    }
  }

  onClickAcceptBtn() {
    this.cookieService.setItem(this.POLICY_COOKIE_NAME, 'true', 365);
    this.showComponent = false;
  }

}
