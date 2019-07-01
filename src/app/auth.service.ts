import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { User } from './util/models';
import { environment } from '../environments/environment';
import { LocalStorageService } from './local-storage.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public userSigned: Subject<undefined> = new Subject();
  private _user: User;
  private authProvider: AuthProvider;

  constructor(private zone: NgZone, private localStorageService: LocalStorageService) {
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
        this.user.points = this.localStorageService.getUserPoints();
        this.authProvider = authProvider;
        this.userSigned.next();
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
  private GoogleAuth: any;

  getUser(): Observable<User> {
    const user = new Subject<User>();
    gapi.load('auth2', () => {
      this.GoogleAuth = gapi.auth2.init({ client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' });
      this.GoogleAuth.then(() => {
        if (this.GoogleAuth.isSignedIn.get() === true) {
          user.next(this.createUser(this.GoogleAuth.currentUser.get()));
        } else {
          this.GoogleAuth.attachClickHandler('g-login-btn', {}, (_user: any) => user.next(this.createUser(_user)));
        }
      }, (error: any) => {
        console.log(`${error.error} ${error.details}`);
      });
    });
    return user.asObservable();
  }

  signout() {
    const openLoginPage = () => setTimeout(() => location.assign('/login'), 0);
    this.GoogleAuth.signOut().then(openLoginPage);
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
      version: 'v3.2'
    });
    FB.Event.subscribe('auth.authResponseChange', this.onFacebookUserStatusChange.bind(this));
    return this.user.asObservable();
  }

  signout() {
    const openLoginPage = () => setTimeout(() => location.assign('/login'), 0);
    FB.logout(openLoginPage);
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

