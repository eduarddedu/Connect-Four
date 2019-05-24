import { Injectable } from '@angular/core';

import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { User } from './util/user';

declare var deepstream: any;
@Injectable({
  providedIn: 'root'
})
export class DeepstreamService {
  private deepstream: deepstreamIO.Client;

  constructor(auth: AuthService) {
    const user: User = auth.user;
    this.deepstream = deepstream(environment.deepstreamUrl, { maxReconnectAttempts: 5 }).login({ username: user.name });
    this.deepstream.on('error', (error: any, event: any, topic: any) => {
      console.log(error, event, topic);
    });
    console.log('Deepstream init...');
  }

  getInstance() {
    return this.deepstream;
  }


}
