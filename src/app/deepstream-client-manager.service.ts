import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthService } from './auth-service.service';

/* import * as deepstream from 'deepstream.io-client-js';
 * Doesn't work, we get runtime error with message 'global is not defined'.
 * Must be some problem in ambient declaration file 'client.d.ts'
 */
declare var deepstream: any;

@Injectable({
  providedIn: 'root'
})
export class DeepstreamClientManager {
  private deepstream: any;
  private user: any;

  constructor(private authService: AuthService) { }

  getInstance() {
    if (!this.deepstream) {
      this.init();
    }
    return this.deepstream;
  }

  private init() {
    this.user = this.authService.user;
    if (!this.user) {
      this.deepstream = null;
    } else {
      this.deepstream = deepstream(environment.DEEPSTREAM_URL,
        { maxReconnectAttempts: 0 }).login(this.user, (success: any, data: any) => {
          if (success) {
            this.registerUser();
            this.unregisterUserOnWindowClose();
          } else {
            throw new Error('Deepstream: authentication failed for ' + this.user.username);
          }
        });
    }
  }

  private registerUser() {
    this.deepstream.record.getList('users').whenReady((users: any) => {
      if (!users.getEntries().includes(this.user.username)) {
        users.addEntry(this.user.username);
      }
    });
  }

  private unregisterUserOnWindowClose() {
    window.addEventListener('beforeunload', (event) => {
      this.deepstream.record.getRecord(this.user.username).delete();
      this.deepstream.record.getList('users').removeEntry(this.user.username);
    });
  }
}
