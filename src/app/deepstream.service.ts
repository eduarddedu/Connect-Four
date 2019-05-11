import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService, User } from './auth.service';

/** */
declare var deepstream: any;

@Injectable({
  providedIn: 'root'
})
export class DeepstreamService {
  private deepstream: deepstreamIO.Client;

  constructor(auth: AuthService) {
    if (auth.currentUser) {
      this.init(auth.currentUser);
    } else {
      auth.user.subscribe((user: User) => this.init(user));
    }
  }

  getInstance() {
    return this.deepstream;
  }

  private init(user: User) {
    console.log('Deepstream init...');
    this.deepstream = deepstream(environment.deepstreamUrl, { maxReconnectAttempts: 5 }).login({ username: user.name });
    this.deepstream.on('error', (error: any, event: any, topic: any) => {
      console.log(error, event, topic);
    });
  }

}
