import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static defaultUser = {
    username: 'No one',
    password: 'default'
  };

  private _user: any;

  constructor() { }

  get user() {
    if (!this._user) {
      return AuthService.defaultUser;
    }
    return this._user;
  }

  /*
   * TODO implement
   */

  authenticate(user: { username: string, password: string }): boolean {
    this._user = user;
    return true;
  }
}
