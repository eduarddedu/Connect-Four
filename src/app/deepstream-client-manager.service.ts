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
  private games: Set<string> = new Set();

  constructor(private authService: AuthService) { }

  getInstance() {
    if (!this.deepstream) {
      this.init();
    }
    return this.deepstream;
  }

  addGame(gameId: string) {
    this.games.add(gameId);
  }

  getGames(): string[] {
    return [].slice.call(this.games);
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
      this.handleErrors();
    }
  }

  private registerUser() {
    this.deepstream.record.getList('users').whenReady((list: any) => {
      if (!this.userRegisteredInAnotherWindowOrDevice(list)) {
        this.deepstream.record.getRecord(this.user.username).set('status', 'Online');
        list.addEntry(this.user.username);
      }
    });
  }

  private userRegisteredInAnotherWindowOrDevice(list: any) {
    return list.getEntries().includes(this.user.username);
  }

  private unregisterUserOnWindowClose() {
    window.addEventListener('beforeunload', (event) => {
      this.deepstream.record.getRecord(this.user.username).delete();
      this.deepstream.record.getList('users').removeEntry(this.user.username);
      this.games.forEach(gameId => {
        this.deepstream.record.getRecord(gameId).delete();
        this.deepstream.record.getList('games').removeEntry(gameId);
      });
    });
  }

  private handleErrors() {
    this.deepstream.on('error', (error: any, event: any) => {
      console.log(error, event);
    });
  }
}
