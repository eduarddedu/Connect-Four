import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';

import { environment } from '../environments/environment';


/** Declare Google and Facebook top-level API objects. */

declare const gapi: any;
declare const FB: any;

/** An interface representing the user */
export interface User {
  id: string;
  name: string;
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

  constructor(private router: Router, private zone: NgZone) {
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
      this.router.navigateByUrl('/');
    }
  }

  signOut() {
    if (this.user.authProvider === null) {
      return;
    }
    if (this.user.authProvider === 'Google') {
      this.GoogleAuth.signOut().then(() => {
        console.log('AuthService -> Google user signed out.');
        window.location.assign('/login');
      });
    } else {
      FB.logout(() => {
        console.log('AuthService -> Facebook user signed out.');
        window.location.assign('/login');
      });
    }
  }

  private initGoogleAuth() {
    /**
     * The id can be spoofed. Use id_token in the backend to verify the id.
     */
    const getUser = (googleUser: any): User => {
      const profile = googleUser.getBasicProfile();
      return <User>{
        id: profile.getId(),
        name: profile.getName(),
        iconUrl: profile.getImageUrl(),
        email: profile.getEmail(),
        idToken: googleUser.getAuthResponse().id_token,
        authProvider: 'Google'
      };
    };
    /**
    * Use zone.run() to return to Angular before setting the user. See: https://github.com/angular/angular/issues/19731
    */
    gapi.load('auth2', () => {
      this.GoogleAuth = gapi.auth2.init({ client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' });
      this.GoogleAuth.then(() => {
        const button: Element = document.getElementById('g-login-btn');
        this.GoogleAuth.attachClickHandler(button, {},
          (googleUser: any) => this.zone.run(() => this.setUser(getUser(googleUser))));
        if (this.GoogleAuth.isSignedIn.get() === true) {
          this.zone.run(() => this.setUser(getUser(this.GoogleAuth.currentUser.get())));
        }
      }, (error: any) => {
        console.log(`${error.error} ${error.details}`);
      });
    });
  }

  private initFacebookAuth() {
    const getUser = (profile: any): User => {
      return {
        id: profile.id,
        name: profile.name,
        iconUrl: profile.picture.data.url,
        email: profile.email,
        authProvider: 'Facebook'
      };
    };
    const onFacebookUserStatusChange = (response: any) => {
      if (response.status === 'connected') {
        FB.api(`/me?fields=id,name,email,picture`,
          (profile: any) => this.zone.run(() => this.setUser(getUser(profile))));
      }
    };
    FB.init({
      appId: '1260178800807045',
      xfbml: true,
      status: true,
      version: 'v3.2'
    });
    FB.Event.subscribe('auth.authResponseChange', onFacebookUserStatusChange.bind(this));
  }


  private mockUser(): User {
    return {
      id: window.localStorage.getItem('id'),
      name: window.localStorage.getItem('username'),
      iconUrl: 'assets/img/user.png',
      email: 'user@example.com',
      authProvider: null
    };
  }
}
