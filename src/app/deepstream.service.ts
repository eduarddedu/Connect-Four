import { Injectable, NgZone } from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { User } from './util/user';

declare var deepstream: any;
@Injectable({
  providedIn: 'root'
})
export class DeepstreamService {
  private client: deepstreamIO.Client;

  constructor(auth: AuthService, ngZone: NgZone) {
    ngZone.runOutsideAngular(this.init.bind(this, auth.user));
  }

  private init(user: User) {
    this.client = deepstream(environment.deepstreamUrl, { maxReconnectAttempts: 5 });
    this.client.login({ username: user.name });
    this.client.on('connectionStateChanged', connectionState => {
      if (connectionState === 'OPEN') {
        console.log('Deepstream connection open');
      }
      if (connectionState === 'CLOSED') {
        console.log('Deepstream connection closed');
      }
    });
    this.client.on('error', (error: any, event: any, topic: any) => {
      console.log(error, event, topic);
    });
  }

  getInstance() {
    return this.client;
  }

  getRecord(recordname: string): deepstreamIO.Record {
    return this.client.record.getRecord(recordname);
  }

  getList(listname: string): deepstreamIO.List {
    return this.client.record.getList(listname);
  }

}
