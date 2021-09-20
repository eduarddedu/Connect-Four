import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { User } from '../util/models';
import { environment } from '../../environments/environment';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public login$: Subject<undefined> = new Subject();
  private _user: User;

  constructor(private zone: NgZone, private localStorage: LocalStorageService) {
    if (environment.production) {
      this.registerProvider(new GoogleAuth());
    } else {
      this.registerProvider(new MockUserAuth());
    }
  }

  get user() {
    return this._user;
  }

  private registerProvider(authProvider: AuthProvider) {
    authProvider.getUser().subscribe((user: User) => {
      this.zone.run(() => {
        this._user = Object.assign(user, { points: this.localStorage.getPoints(user) });
        this.user.points = this.localStorage.getPoints(this.user);
        this.login$.next();
      });
    });
  }
}

interface AuthProvider {
  getUser: () => Observable<User>;
}

/* Entry point to Google OAuth API */
declare const google: any;
declare const jwt_decode: Function;

class GoogleAuth implements AuthProvider {
  private credentials = { client_id: '38363229102-8rv4hrse6uurnnig1lcjj1cpp8ep58da.apps.googleusercontent.com' };
  private user = new Subject<User>();

  getUser(): Observable<User> {
    google.accounts.id.initialize({
      client_id: this.credentials.client_id,
      callback: this.handleCredentialResponse.bind(this)
    });
    if (environment.production) {
      google.accounts.id.prompt();
    }
    return this.user.asObservable();
  }

  decodeJwtResponse(credential: string) {
    return jwt_decode(credential);
  }

  handleCredentialResponse(response: any) {
    const credential = this.decodeJwtResponse(response.credential);
    const user: User = this.createUser(credential);
    this.user.next(user);
  }

  private createUser(credential: any): User {
    return {
      id: credential.sub,
      name: credential.name,
      imgUrl: credential.picture,
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
}

