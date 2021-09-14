import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { User } from './util/models';
import { environment } from '../environments/environment';
import { LocalStorageService } from './local-storage.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public login$: Subject<undefined> = new Subject();
  private _user: User;
  private authProvider: AuthProvider;

  constructor(private zone: NgZone, private localStorage: LocalStorageService) {
    if (environment.production) {
      this.registerProvider(new FacebookAuth());
      this.registerProvider(new GoogleAuth());
    } else {
      this.registerProvider(new MockUserAuth());
    }
  }

  get user() {
    return this._user;
  }

  signout() {
    this.authProvider.signout();
  }

  private registerProvider(authProvider: AuthProvider) {
    authProvider.getUser().subscribe((user: User) => {
      this.zone.run(() => {
        this._user = user;
        this.user.points = this.localStorage.getPoints(this.user);
        this.authProvider = authProvider;
        this.login$.next();
      });
    });
  }
}

interface AuthProvider {
  getUser: () => Observable<User>;
  signout: () => void;
}

/* Entry points to OAuth APIs */
declare const gapi: any;
declare const FB: any;

class GoogleAuth implements AuthProvider {
  private googleAuth: any;
  private credentials = { client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' };
  private user = new Subject<User>();

  getUser(): Observable<User> {
    gapi.load('auth2', () => {
      this.googleAuth = gapi.auth2.init(this.credentials);
      this.googleAuth.then(() => {
        if (this.googleAuth.isSignedIn.get() === true) {
          this.user.next(this.createUser(this.googleAuth.currentUser.get()));
        } else {
          this.googleAuth.attachClickHandler('g-login-btn', {}, (_user: any) => this.user.next(this.createUser(_user)));
        }
      }, (error: any) => {
        console.log(`${error.error} ${error.details}`);
      });
    });
    return this.user.asObservable();
  }

  signout() {
    this.googleAuth.signOut().then(() => setTimeout(() => location.assign('/login'), 0));
  }

  private createUser(googleUser: any): User {
    const profile = googleUser.getBasicProfile();
    return {
      id: profile.getId(),
      name: profile.getName(),
      imgUrl: profile.getImageUrl(),
      status: 'Online'
    };
  }
}

class FacebookAuth implements AuthProvider {
  private user = new Subject<User>();

  getUser(): Observable<User> {
    FB.init({
      appId: '1260178800807045',
      xfbml: true,
      status: true,
      version: 'v3.3'
    });
    FB.Event.subscribe('auth.authResponseChange', this.onFacebookUserStatusChange.bind(this));
    return this.user.asObservable();
  }

  signout() {
    FB.logout(() => setTimeout(() => location.assign('/login'), 0));
  }

  private onFacebookUserStatusChange(response: any) {
    if (response.status === 'connected') {
      FB.api(`/me?fields=id,name,email,picture`,
        (profile: any) => this.user.next(this.createUser(profile)));
    }
  }

  private createUser(profile: any): User {
    return {
      id: profile.id,
      name: profile.name,
      imgUrl: profile.picture.data.url,
      status: 'Online'
    };
  }
}

class MockUserAuth implements AuthProvider {

  getUser(): Observable<User> {
    return new Observable(subscriber => {
      if (!environment.production) {
        subscriber.next(<User>{
          id: localStorage.getItem('id'),
          name: localStorage.getItem('username'),
          imgUrl: 'assets/img/user.png',
          status: 'Online'
        });
      }
    });
  }

  signout() {
    setTimeout(() => location.assign('/login'), 0);
  }
}

