import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService, User } from './auth.service';

/** */
declare var deepstream: any;

@Injectable({
  providedIn: 'root'
})
export class DeepstreamService {
  private deepstream: any;

  constructor(auth: AuthService) {
    if (auth.user) {
      this.init(auth.user);
    } else {
      auth.userSignIn.subscribe((user: User) => this.init(user));
    }
  }

  getInstance() {
    return this.deepstream;
  }

  private init(user: User) {
    console.log('Deepstream init...');
    this.deepstream = deepstream(environment.DEEPSTREAM_URL, { maxReconnectAttempts: 0 }).login(({ username: user.name }));
    this.deepstream.on('error', (error: any, event: any, topic: any) => {
      console.log(error, event, topic);
    });
  }

}
