import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthService } from './auth-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

/* import * as deepstream from 'deepstream.io-client-js';
 * Doesn't work, we get runtime error with message 'global is not defined'.
 * Must be some problem in ambient declaration file 'client.d.ts'
 */
declare var deepstream: any;

@Injectable({
  providedIn: 'root'
})
export class DeepstreamClientManager {
  private client: any;
  private user: any;

  constructor(private authService: AuthService, private modalService: NgbModal) { }

  getInstance() {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }

  private init() {
    this.user = this.authService.user;
    if (this.user === AuthService.defaultUser) {
      return null;
    }
    this.client = deepstream(environment.DEEPSTREAM_URL).login(this.user, (success: any, data: any) => {
      if (success) {
        this.registerUser();
        this.unregisterUserOnWindowClose();
      } else {
        throw new Error('Deepstream: authentication failed for ' + this.user.username);
      }
    });
    this.handleErrors();
  }

  private registerUser() {
    this.client.record.getList('users').whenReady((list: any) => {
      if (!this.userRegisteredInAnotherWindowOrDevice(list)) {
        this.client.record.getRecord(this.user.username).set('status', 'Online');
        list.addEntry(this.user.username);
        console.log(`Deepstream: ${this.user.username} signed in`);
      }
    });
  }

  private userRegisteredInAnotherWindowOrDevice(list: any) {
    return list.getEntries().includes(this.user.username);
  }

  private unregisterUserOnWindowClose() {
    window.addEventListener('beforeunload', (event) => {
      this.client.record.getRecord(this.user.username).delete();
      this.client.record.getList('users').removeEntry(this.user.username);
    });
  }

  private handleErrors() {
    this.client.on('error', (error: any, event: any) => {
       console.log(error, event);
    });
  }
}
