/**
 * RealtimeService wraps around the Deepstream client API.
 * The goal is provide the app with the ability to sync data across clients.
 *
 * By isolating Deepstream client code we aim to:
 *  - describe more clearly what our app needs to do - our data-sync policy - via dedicated API provided by an internal service
 *  - separate the policy from implementation details
 *  - make it easier to be replace Deepstream in the future, if needed.
 *
 * For clarity, the API is split into three distinct namespaces: 'users', 'games' and 'messages'.
 */

import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber, Subject } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { User, UserData, UserStatus } from '../util/models';
import { Game } from '../game/game';
import { NotificationService } from './notification.service';
import { Move, State } from '../game/engine';
import { GameContext } from '../game/game.context';


@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private user: User;
  private ds: DeepstreamService;

  public users: Users;
  public games: Games;
  public messages: Messages;

  constructor(private ngZone: NgZone, auth: AuthService, private notification: NotificationService) {
    this.user = auth.user;
    this.ds = new DeepstreamService(this.ngZone, this.user, this.notification);
    this.users = new Users(this.ngZone, this.ds, this.user);
    this.games = new Games(this.ngZone, this.ds);
    this.messages = new Messages(this.ngZone, this.ds, this.user);
  }

  emitParallelLoginEvent() {
    this.ds.client.event.emit(`${this.user.id}/parallel-login`, undefined);
  }

  onParallelLoginEvent(callback: () => void) {
    this.ds.client.event.subscribe(`${this.user.id}/parallel-login`, () => {
      this.ngZone.run(callback);
    });
  }

}

declare var deepstream: Function;

class DeepstreamService {
  client: deepstreamIO.Client;

  constructor(private ngZone: NgZone, private user: User, private notification: NotificationService) {
    this.ngZone.runOutsideAngular(this.init.bind(this));
  }

  private log(...items: string[]) {
    let header = 'Deepstream -';
    items.forEach(s => header = header.concat(' ', s));
    console.log(header);
  }

  private init() {
    this.client = deepstream(environment.deepstreamUrl, { maxReconnectAttempts: 1 });
    this.client.login({ username: this.user.name });
    this.client.on('connectionStateChanged', (connectionState: string) => {
      switch (connectionState) {
        case 'OPEN':
          this.log('connection open: ' + environment.deepstreamUrl);
          break;
        case 'CLOSED':
          this.log('connection closed: ' + environment.deepstreamUrl);
          break;
        case 'AWAITING_CONNECTION':
          break;
        case 'ERROR':
          this.notification.update('Connection error. Please try reloading the page.', 'danger');
      }
    });
    this.client.on('error', (error: string, event: any, topic: any) => {
      this.log(error, event, topic);
    });
  }

  /**
   * Retrieves data from an Deepstream record and returns it as Promise
   * The Promise will only complete if/when the record contains a non-empty
   * data object.
   * @param recordName name of the record
   */

  getRecordData(recordName: string): Promise<any> {
    return new Promise(resolve => {
      const record = this.client.record.getRecord(recordName);
      const loadOnce = (data: any) => {
        if (Object.keys(data).length > 0) {
          record.unsubscribe(loadOnce);
          resolve(data);
        }
      };
      record.subscribe(loadOnce, true);
    });
  }

  /**
   * Set multiple paths in a Deepstream record at once
   * @param recordName name of record
   * @param data a data container object whose properties will be persisted to the record
   */

  setRecordKeys(recordName: string, data: { [key: string]: any }) {
    const record = this.client.record.getRecord(recordName);
    Object.keys(data).forEach(key => {
      const value = data[key];
      record.set(key, value);
    });
  }
}

class Users {
  private list: deepstreamIO.List;
  private mapUserIdRecordId: Map<string, string> = new Map();

  public added: Subject<User> = new Subject();
  public removed: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private ds: DeepstreamService, private user: User) {
    this.list = this.ds.client.record.getList('users');
    this.subscribeToTopics();
  }

  private subscribeToTopics() {
    this.list.on('entry-added', async id => {
      const userData: UserData = await this.ds.getRecordData(id);
      const user = new User(userData);
      this.mapUserIdRecordId.set(user.id, id);
      this.ngZone.run(() => this.added.next(user));
    });
    this.list.on('entry-removed', id => {
      let userId: string;
      this.mapUserIdRecordId.forEach((value: string, key: string) => {
        if (value === id) {
          userId = key;
        }
      });
      this.mapUserIdRecordId.delete(userId);
      this.ngZone.run(() => this.removed.next(userId));
    });
  }

  addUser() {
    const recordId = this.ds.client.getUid();
    const record = this.ds.client.record.getRecord(recordId);
    this.list.addEntry(recordId);
    record.whenReady((r: deepstreamIO.Record) => r.set(this.user));
    this.mapUserIdRecordId.set(this.user.id, recordId);
  }

  removeUser() {
    const recordId = this.mapUserIdRecordId.get(this.user.id);
    this.list.removeEntry(recordId);
    this.ds.client.record.getRecord(recordId).delete();
  }

  get all(): Observable<User[]> {
    return Observable.create((subscriber: Subscriber<User[]>) => {
      this.ngZone.run(() => {
        this.list.whenReady(async (list: deepstreamIO.List) => {
          const users: Array<User> = [];
          for (const recordId of list.getEntries()) {
            const userData = await this.ds.getRecordData(recordId);
            const user = new User(userData);
            users.push(user);
            this.mapUserIdRecordId.set(user.id, recordId);
          }
          subscriber.next(users);
        });
      });
    });
  }

  setUserStatus(userId: string, status: UserStatus) {
    const recordId = this.mapUserIdRecordId.get(userId);
    this.ds.client.record.getRecord(recordId).set('status', status);
  }

  onUserStatusChange(userId: string, callback: (userId: string, status: UserStatus) => void, thisArg: any) {
    const recordId = this.mapUserIdRecordId.get(userId);
    this.ds.client.record.getRecord(recordId).subscribe('status', status => {
      this.ngZone.run(callback.bind(thisArg, userId, status));
    });
  }

}

class Games {
  private list: deepstreamIO.List;
  public added: Subject<Game> = new Subject();
  public removed: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private ds: DeepstreamService) {
    this.list = this.ds.client.record.getList('games');
    this.subscribeToTopics();
  }

  private subscribeToTopics() {
    this.list.on('entry-added', async gameId => {
      const ctx = await this.ds.getRecordData(gameId);
      this.ngZone.run(() => this.added.next(new Game(ctx)));
    });
    this.list.on('entry-removed', (gameId: string) => {
      this.ngZone.run(() => this.removed.next(gameId));
    });
  }

  fetchGame(gameId: string): Observable<Game> {
    return new Observable((subscriber: Subscriber<Game>) => {
      this.ngZone.run(async () => subscriber.next(new Game(await this.ds.getRecordData(gameId))));
    });
  }

  createGame(red: User, yellow: User, initialState: State.RED_MOVES | State.YELLOW_MOVES): Game {
    const id = this.ds.client.getUid();
    const ctx = new GameContext(id, red, yellow, initialState);
    this.ds.client.record.getRecord(id).whenReady((record: deepstreamIO.Record) => {
      record.set(ctx);
      this.list.addEntry(id);
    });
    return new Game(ctx);
  }

  removeGame(gameId: string) {
    this.list.removeEntry(gameId);
    this.ds.client.record.getRecord(gameId).delete();
  }

  updateGameProperties(gameId: string, properties: { [key: string]: any }) {
    this.ds.setRecordKeys(gameId, properties);
  }

  updateGameMoves(gameId: string, move: Move) {
    this.ds.client.event.emit(`moves/${gameId}`, move);
    const record = this.ds.client.record.getRecord(gameId);
    const moves: Move[] = record.get('moves');
    moves.push(move);
    record.set('moves', moves);
  }

  onGameMovesUpdate(gameId: string, callback: (move: Move) => void, thisArg: any) {
    this.ds.client.event.subscribe(`moves/${gameId}`, move => {
      this.ngZone.run(callback.bind(thisArg, move));
    });
  }

  onGamePointsUpdate(gameId: string, callback: (gameId: string, points: { red: number, yellow: number }) => void, thisArg: any) {
    this.ds.client.record.getRecord(gameId).subscribe('points', points => {
      this.ngZone.run(callback.bind(thisArg, gameId, points));
    });
  }

  unsubscribeFromUpdates(gameId: string) {
    const record = this.ds.client.record.getRecord(gameId);
    record.unsubscribe('state', undefined);
    this.ds.client.event.unsubscribe(`moves/${gameId}`, undefined);
  }

  get all(): Observable<Game[]> {
    return Observable.create((subscriber: Subscriber<Game[]>) => {
      this.ngZone.run(() => {
        const games: Game[] = [];
        this.list.whenReady(async (list: deepstreamIO.List) => {
          for (const gameId of list.getEntries()) {
            games.push(new Game(await this.ds.getRecordData(gameId)));
          }
          subscriber.next(games);
        });
      });
    });
  }
}

class Messages {
  createGame: Subject<{ senderId: string, senderPlaysRed: boolean, redMovesFirst: boolean }> = new Subject();
  accept: Subject<string> = new Subject();
  reject: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private ds: DeepstreamService, private user: User) {
    this.ds.client.event.subscribe(`${this.user.id}/createGame`, (data: {
      senderId: string,
      senderPlaysRed: boolean, redMovesFirst: boolean
    }) => {
      this.ngZone.run(() => this.createGame.next(data));
    });
    this.ds.client.event.subscribe(`${this.user.id}/accept`, (data: { senderId: string }) => {
      this.ngZone.run(() => this.accept.next(data.senderId));
    });
    this.ds.client.event.subscribe(`${this.user.id}/reject`, (data: { senderId: string }) => {
      this.ngZone.run(() => this.reject.next(data.senderId));
    });
  }

  private sendMessage(recipientId: string, topic: MessageTopic, data = {}) {
    this.ds.client.event.emit(`${recipientId}/${topic}`, Object.assign({ senderId: this.user.id }, data));
  }

  sendCreateGameMessage(recipientId: string, senderPlaysRed: boolean, redMovesFirst: boolean) {
    this.sendMessage(recipientId, 'createGame', { senderPlaysRed: senderPlaysRed, redMovesFirst: redMovesFirst });
  }

  sendAcceptMessage(recipientId: string) {
    this.sendMessage(recipientId, 'accept');
  }

  sendRejectMessage(recipientId: string) {
    this.sendMessage(recipientId, 'reject');
  }
}

type MessageTopic = 'createGame' | 'accept' | 'reject';
