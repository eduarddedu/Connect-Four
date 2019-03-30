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
  private user: User;

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
    this.user = user;
    this.deepstream = deepstream(environment.DEEPSTREAM_URL, { maxReconnectAttempts: 5 }).login(({ username: user.name }));
    this.deepstream.on('error', (error: any, event: any, topic: any) => {
      console.log(error, event, topic);
    });
    this.deepstream.record.getList('users').whenReady((users: any) => {
      if (!users.getEntries().includes(user.id)) {
        users.addEntry(user.id);
        this.deepstream.record.getRecord(user.id).set(user);
      }
    });
    window.addEventListener('beforeunload', this.signOut.bind(this));
  }

  signOut() {
    this.deepstream.record.getRecord(this.user.id).delete();
    this.deepstream.record.getList('users').removeEntry(this.user.id);
  }

}
