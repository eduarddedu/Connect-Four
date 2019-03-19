import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { environment } from '../environments/environment';


/** Declare Google and Facebook top-level API objects. */

declare const gapi: any;
declare const FB: any;

/** An interface representing the user */
export interface User {
  id: string;
  username: string;
  iconUrl: string;
  email: string;
  authProvider: 'Google' | 'Facebook' | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user: User;
  private subjectUserSigned: Subject<User> = new Subject();
  public readonly userSignIn: Observable<User> = this.subjectUserSigned.asObservable();
  private GoogleAuth: any;

  constructor() {
    if (environment.production) {
      this.initGoogleAuth();
      this.initFacebookAuth();
    } else {
      this.setUser(this.mockUser());
    }
  }

  get user(): User {
    return this._user ? Object.assign(this._user) : null;
  }

  private setUser(user: User) {
    if (this._user) {
      return;
    } else {
      (function (o) {
        Object.keys(o).forEach(k => console.log(`${k} : ${o[k]}`));
      })(user);
      this._user = user;
      this.subjectUserSigned.next(user);
    }
  }

  signOut() {
    if (this.user.authProvider === null) {
      return;
    }
    if (this.user.authProvider === 'Google') {
      this.GoogleAuth.signOut().then(() => console.log('AuthService -> Google user signed out.'));
    } else {
      FB.logout(() => console.log('AuthService -> Facebook user signed out.'));
    }
    this._user = null;
  }

  private initGoogleAuth() {
    gapi.load('auth2', () => {
      this.GoogleAuth = gapi.auth2.init({ client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' });
      this.GoogleAuth.then(() => {
        const button: Element = document.getElementById('g-login-btn');
        this.GoogleAuth.attachClickHandler(button, {}, this.setGoogleUser.bind(this));
        if (this.GoogleAuth.isSignedIn.get() === true) {
          this.setGoogleUser(this.GoogleAuth.currentUser.get());
        }
      }, (error: any) => {
        console.log(`${error.error} ${error.details}`);
      });
    });
  }

  private setGoogleUser(googleUser: any) {
    const profile = googleUser.getBasicProfile();
    this.setUser(<User>{
      id: profile.getId(), // do not send to backend
      username: profile.getName(),
      iconUrl: profile.getImageUrl(),
      email: profile.getEmail(),
      idToken: googleUser.getAuthResponse().id_token,  /** in the backend, should use id_token to verify the id */
      authProvider: 'Google'
    });
  }

  private initFacebookAuth() {
    FB.init({
      appId: '1260178800807045',
      xfbml: true,
      status: true,
      version: 'v3.2'
    });
    FB.Event.subscribe('auth.authResponseChange', this.onFacebookUserStatusChange.bind(this));
  }

  private onFacebookUserStatusChange(response: any) {
    if (response.status === 'connected') {
      FB.api(`/me?fields=id,name,email,picture`, (profile: any) => {
        this.setUser({
          id: profile.id,
          username: profile.name,
          iconUrl: profile.picture.data.url,
          email: profile.email,
          authProvider: 'Facebook'
        });
      });
    }
  }

  private mockUser(): User {
    return {
      id: Math.random().toString(16).substr(2),
      username: window.localStorage.getItem('username'),
      iconUrl: '',
      email: 'user@example.com',
      authProvider: null
    };
  }
}
