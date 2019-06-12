import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable, race } from 'rxjs';

import { User } from './util/models';
import { environment } from '../environments/environment';

/* Global entry points to OAuth APIs */
declare const gapi: any;
declare const FB: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public signin: Subject<any> = new Subject();
  private _user: User;
  private GoogleAuth: any;

  constructor(zone: NgZone) {
    if (environment.production) {
      race(this.googleUserSigned(), this.facebookUserSigned())
        .subscribe((user: User) => {
          zone.run(() => {
            this._user = user;
            this.signin.next();
          });
        });
    } else {
      this._user = this.mockUser();
    }
  }

  get user() {
    return Object.assign(this._user);
  }

  private googleUserSigned(): Observable<User> {
    const user = new Subject<User>();
    const getUser = (googleUser: any): User => {
      const profile = googleUser.getBasicProfile();
      return <User>{
        id: profile.getId(),
        name: profile.getName(),
        imgUrl: profile.getImageUrl(),
        email: profile.getEmail(),
        idToken: googleUser.getAuthResponse().id_token,
        authProvider: 'Google',
        status: 'Online'
      };
    };
    gapi.load('auth2', () => {
      this.GoogleAuth = gapi.auth2.init({ client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' });
      this.GoogleAuth.then(() => {
        if (this.GoogleAuth.isSignedIn.get() === true) {
          user.next(getUser(this.GoogleAuth.currentUser.get()));
        } else {
          this.GoogleAuth.attachClickHandler('g-login-btn', {}, (googleUser: any) => user.next(getUser(googleUser)));
        }
      }, (error: any) => {
        console.log(`${error.error} ${error.details}`);
      });
    });
    return user.asObservable();
  }

  signout() {
    const openLoginPage = () => setTimeout(() => location.assign('/login'), 0);
    if (this._user.authProvider === 'Google') {
      this.GoogleAuth.signOut().then(openLoginPage);
    } else if (this._user.authProvider === 'Facebook') {
      FB.logout(openLoginPage);
    } else {
      openLoginPage();
    }
  }

  private facebookUserSigned(): Observable<User> {
    const user = new Subject<User>();
    const getUser = (profile: any): User => {
      return {
        id: profile.id,
        name: profile.name,
        imgUrl: profile.picture.data.url,
        email: profile.email,
        authProvider: 'Facebook',
        status: 'Online'
      };
    };
    const onFacebookUserStatusChange = (response: any) => {
      if (response.status === 'connected') {
        FB.api(`/me?fields=id,name,email,picture`,
          (profile: any) => user.next(getUser(profile)));
      }
    };
    FB.init({
      appId: '1260178800807045',
      xfbml: true,
      status: true,
      version: 'v3.2'
    });
    FB.Event.subscribe('auth.authResponseChange', onFacebookUserStatusChange.bind(this));
    return user.asObservable();
  }

  private mockUser(): User {
    return {
      id: localStorage.getItem('id'),
      name: localStorage.getItem('username'),
      imgUrl: 'assets/img/user.png',
      email: null,
      authProvider: null,
      status: 'Online'
    };
  }
}
