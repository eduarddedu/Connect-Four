import { Injectable, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { User, Bot } from './util/user';
import { DeepstreamService } from './deepstream.service';
import { NotificationService } from './notification.service';
import { GameInvitationComponent } from './modals/game-invitation/game-invitation.component';
import { Game } from './game/game';

@Injectable({
  providedIn: 'root'
})
export class NewGameService {
  public subject: Subject<any> = new Subject();
  private user: User;
  private client: deepstreamIO.Client;

  constructor(
    private ngZone: NgZone,
    private modalService: NgbModal,
    private notification: NotificationService,
    private deepstream: DeepstreamService, auth: AuthService) {
    this.client = deepstream.getInstance();
    this.user = auth.user;
    this.client.event.subscribe(`newGame/${this.user.id}`, this.onMessage.bind(this));
  }

  async pushAiGame() {
    this.deepstream.getRecord(this.user.id).set('status', 'Busy');
    const gameId = await this.createGame(this.user, Bot);
    this.deepstream.getList('games').addEntry(gameId);
    this.subject.next(await this.loadGame(gameId));
  }

  async pushGame(gameId: string) {
    this.subject.next(await this.loadGame(gameId));
  }

  invite(user: User) {
    if (user.status === 'Online') {
      this.deepstream.getRecord(user.id).set('status', 'Busy');
      this.send(user.id, new Message(this.user.id, 'Create Game'));
      this.notification.update(`Invitation sent. Waiting for ${user.name}`, 'success');
    }
  }

  sendRematchInvitation(opponentUID: string, gameId: string) {
    this.send(opponentUID, new Message(this.user.id, 'Rematch', { gameId: gameId }));
  }

  private loadGame(gameId: string): Promise<any> {
    return new Promise(resolve => {
      const record = this.deepstream.getRecord(gameId);
      const loadOnce = (data: any) => {
        if (data.id) {
          record.unsubscribe(loadOnce);
          resolve(new Game(data, this.user));
        }
      };
      record.subscribe(loadOnce, true);
    });
  }

  private createGame(red: User, yellow: User): Promise<string> {
    return new Promise(resolve => {
      const gameId = this.client.getUid();
      this.deepstream.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
        record.set({
          id: gameId,
          startDate: Date.now(),
          players: { red: red, yellow: yellow },
          redMovesFirst: true,
          state: 'in progress',
          moves: [],
          points: { red: 0, yellow: 0 }
        });
        resolve(gameId);
      });
    });
  }

  private async onMessage(message: Message) {
    const user: User = this.deepstream.getRecord(message.senderUID).get();
    switch (message.topic) {
      case 'Create Game':
      case 'Rematch':
        this.ngZone.run(this.respond.bind(this, message));
        break;
      case 'Accept':
        this.deepstream.getRecord(this.user.id).set('status', 'In game');
        this.deepstream.getRecord(user.id).set('status', 'In game');
        this.subject.next(await this.loadGame(message.details.gameId));
        this.notification.update(`${user.name} accepted your invitation`, 'success');
        break;
      case 'Reject':
        this.notification.update(`${user.name} turned down your invitation`, 'warning');
    }
  }

  private respond(message: Message) {
    const userRecord = this.deepstream.getRecord(message.senderUID);
    let user = userRecord.get();
    const modal = this.modalService.open(GameInvitationComponent);
    modal.componentInstance.user = user;
    modal.result.then(async (option: string) => {
      user = userRecord.get();
      if (option === 'Accept') {
        switch (message.topic) {
          case 'Create Game':
            if (user.status === 'Online') {
              const gameId = await this.createGame(this.user, user);
              this.deepstream.getList('games').addEntry(gameId);
              this.send(user.id, new Message(this.user.id, 'Accept', { gameId: gameId }));
              this.subject.next(await this.loadGame(gameId));
            } else {
              this.deepstream.getRecord(this.user.id).set('status', 'Online');
              this.notification.update(`${user.name} is not available`, 'warning');
            }
            break;
          case 'Rematch':
            if (user.status === 'In game') {
              this.deepstream.getRecord(message.details.gameId).set('state', 'in progress');
            } else {
              this.deepstream.getRecord(this.user.id).set('status', 'Online');
              this.notification.update(`${user.name} is not available`, 'warning');
            }
        }
      } else {
        this.send(user.id, new Message(this.user.id, 'Reject'));
        this.deepstream.getRecord(this.user.id).set('status', 'Online');
      }
    });
  }

  private send(receipientUID: string, message: Message) {
    this.client.event.emit(`newGame/${receipientUID}`, message);
  }
}

type Topic = 'Create Game' | 'Accept' | 'Rematch' | 'Reject';

interface Message {
  senderUID: string;
  topic: Topic;
  details?: {
    gameId: string;
  };
}
class Message implements Message {
  constructor(public senderUID: string, public topic: Topic, public details?: {
    gameId: string;
  }) { }
}
