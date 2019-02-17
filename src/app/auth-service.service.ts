import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user: { username: string };

  constructor(private cookieService: CookieService) { }

  get user() {
    const cvalue = this.cookieService.getCookie('auth');
    if (cvalue) {
      const username = new RegExp(/^username:([^:]+)/).exec(cvalue)[1];
      this._user = { username: username };
    }
    return this._user;
  }

  /*
   * TODO implement
   */

  authenticate(user: { username: string, password: string }): boolean {
    const cvalue = `username:${user.username}`;
    this.cookieService.setCookie('auth', cvalue, 365);
    return true;
  }
}
