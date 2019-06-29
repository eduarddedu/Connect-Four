/**
 * RealtimeService provides the realtime data-sync functionality which high-level GUI components depend on.
 *
 * This class wraps around the Deepstream JavaScript client library.
 *
 * The goal is to:
 *  - specify our app concerns/needs in an abstract way (ideally an interface should be used)
 *  - separate app policy from implementation details
 *  - isolate the Deepstream external dependency, allowing it to be replaced in the future if necessary.
 *
 *
 * For clarity, the API is split into three distinct namespaces: 'users', 'games' and 'messages'.
 */

import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber, Subject } from 'rxjs';

import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { User } from './util/models';
import { Game } from './game/game';


@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private user: User;
  private ds: DeepstreamService;

  public users: ServiceUsers;
  public games: ServiceGames;
  public messages: ServiceMessages;

  constructor(private ngZone: NgZone, auth: AuthService) {
    this.user = auth.user;
    this.ds = new DeepstreamService(this.ngZone, this.user);
    this.users = new ServiceUsers(this.ngZone, this.ds);
    this.games = new ServiceGames(this.ngZone, this.user, this.ds);
    this.messages = new ServiceMessages(this.ngZone, this.user, this.ds);
  }

}

declare var deepstream: Function;

class DeepstreamService {
  client: deepstreamIO.Client;

  constructor(private ngZone: NgZone, private user: User) {
    this.ngZone.runOutsideAngular(this.init.bind(this));
  }

  private init() {
    this.client = deepstream(environment.deepstreamUrl, { maxReconnectAttempts: 5 });
    this.client.login({ username: this.user.name });
    this.client.on('connectionStateChanged', (connectionState: string) => {
      switch (connectionState) {
        case 'OPEN':
          console.log('Deepstream connection open');
          break;
        case 'CLOSED':
          console.log('Deepstream connection closed');
      }
    });
    this.client.on('error', (error: string, event: any, topic: any) => {
      console.log(error, event, topic);
      throw new Error(`${error}, ${event}, ${topic}`);
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

class ServiceUsers {
  private usersList: deepstreamIO.List;
  added: Subject<User> = new Subject();
  removed: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private ds: DeepstreamService) {
    this.usersList = this.ds.client.record.getList('users');
    this.usersList.on('entry-added', async userId => {
      const user: User = await this.ds.getRecordData(userId);
      this.ngZone.run(() => this.added.next(user));
    });
    this.usersList.on('entry-removed', userId => this.ngZone.run(() => this.removed.next(userId)));
  }

  add(user: User) {
    this.usersList.addEntry(user.id);
    this.ds.client.record.getRecord(user.id).whenReady((record: deepstreamIO.Record) => record.set(user));
  }

  remove(userId: string) {
    this.usersList.removeEntry(userId);
    this.ds.client.record.getRecord(userId).delete();
  }

  get all(): Observable<User[]> {
    return Observable.create((subscriber: Subscriber<User[]>) => {
      this.usersList.whenReady(async (list: deepstreamIO.List) => {
        const users: Array<User> = [];
        for (const userId of list.getEntries()) {
          users.push(await this.ds.getRecordData(userId));
        }
        this.ngZone.run(() => subscriber.next(users));
      });
    });
  }

  setUserStatus(userId: string, status: 'Online' | 'Busy' | 'In game') {
    this.ds.client.record.getRecord(userId).set('status', status);
  }

  onUserStatusChange(userId: string, callback: (userId: string, status: string) => void, thisArg: any) {
    this.ds.client.record.getRecord(userId).subscribe('status', status => {
      this.ngZone.run(callback.bind(thisArg, userId, status));
    });
  }

}

class ServiceGames {
  private gamesList: deepstreamIO.List;
  added: Subject<Game> = new Subject();
  removed: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private user: User, private ds: DeepstreamService) {
    this.gamesList = this.ds.client.record.getList('games');
    this.gamesList.on('entry-added', async gameId => {
      const data = await this.ds.getRecordData(gameId);
      const game: Game = new Game(data, this.user);
      this.ngZone.run(() => this.added.next(game));
    });
    this.gamesList.on('entry-removed', (gameId: string) => {
      this.ngZone.run(() => this.removed.next(gameId));
    });
  }

  private createGameRecord(data: any): string {
    const gameId = this.ds.client.getUid();
    this.ds.client.record.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
      record.set(Object.assign(data, { id: gameId }));
      this.gamesList.addEntry(gameId);
    });
    return gameId;
  }

  get(gameId: string): Observable<Game> {
    return new Observable((subscriber: Subscriber<Game>) => {
      this.ds.client.record.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
        const game = new Game(record.get(), this.user);
        this.ngZone.run(() => subscriber.next(game));
      });
    });
  }

  createGame(red: User, yellow: User, redMovesFirst: boolean): Game {
    const data = {
      startDate: Date.now(),
      players: { red: red, yellow: yellow },
      redMovesFirst: redMovesFirst,
      state: 'in progress',
      moves: [],
      points: { red: 0, yellow: 0 }
    } as any;
    data.id = this.createGameRecord(data);
    return new Game(data, this.user);
  }

  remove(gameId: string) {
    this.gamesList.removeEntry(gameId);
    this.ds.client.record.getRecord(gameId).delete();
  }

  updateGameProperties(gameId: string, properties: { [key: string]: any }) {
    this.ds.setRecordKeys(gameId, properties);
  }

  updateGameState(gameId: string, state: 'in progress' | 'over' | 'on hold') {
    this.ds.client.record.getRecord(gameId).set('state', state);
  }

  updateGameMoves(gameId: string, moveId: string) {
    this.ds.client.event.emit(`moves/${gameId}`, moveId);
    const record = this.ds.client.record.getRecord(gameId);
    const moves: string[] = record.get('moves');
    moves.push(moveId);
    record.set('moves', moves);
  }

  onGameMovesUpdate(gameId: string, callback: (moveId: string) => void, thisArg: any) {
    this.ds.client.event.subscribe(`moves/${gameId}`, moveId => {
      this.ngZone.run(callback.bind(thisArg, moveId));
    });
  }

  onGameStateUpdate(gameId: string, callback: (status: string) => void, thisArg: any) {
    this.ds.client.record.getRecord(gameId).subscribe('state', state => {
      this.ngZone.run(callback.bind(thisArg, state));
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
      const games: Game[] = [];
      this.gamesList.whenReady(async (list: deepstreamIO.List) => {
        for (const gameId of list.getEntries()) {
          const data = await this.ds.getRecordData(gameId);
          const game = new Game(data, this.user);
          games.push(game);
        }
        this.ngZone.run(() => subscriber.next(games));
      });
    });
  }
}

class ServiceMessages {
  createGame: Subject<{senderId: string, senderPlaysRed: boolean}> = new Subject();
  accept: Subject<string> = new Subject();
  reject: Subject<string> = new Subject();

  constructor(private ngZone: NgZone, private user: User, private ds: DeepstreamService) {
    this.ds.client.event.subscribe(`${this.user.id}/createGame`, (data: {senderId: string, senderPlaysRed: boolean}) => {
      this.ngZone.run(() => this.createGame.next(data));
    });
    this.ds.client.event.subscribe(`${this.user.id}/accept`, (data: {senderId: string}) => {
      this.ngZone.run(() => this.accept.next(data.senderId));
    });
    this.ds.client.event.subscribe(`${this.user.id}/reject`, (data: {senderId: string}) => {
      this.ngZone.run(() => this.reject.next(data.senderId));
    });
  }

  private sendMessage(recipientId: string, topic: MessageTopic, data = {}) {
    this.ds.client.event.emit(`${recipientId}/${topic}`, Object.assign({senderId: this.user.id}, data));
  }

  sendCreateGameMessage(recipientId: string, senderPlaysRed: boolean) {
    this.sendMessage(recipientId, 'createGame', {senderPlaysRed: senderPlaysRed});
  }

  sendAcceptMessage(recipientId: string) {
    this.sendMessage(recipientId, 'accept');
  }

  sendRejectMessage(recipientId: string) {
    this.sendMessage(recipientId, 'reject');
  }
}

type MessageTopic = 'createGame' | 'accept' | 'reject';
