import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { User, Bot } from './util/user';
import { DeepstreamService } from './deepstream.service';
import { NotificationService } from './notification.service';
import { GameInvitationComponent } from './modals/game-invitation/game-invitation.component';

@Injectable({
  providedIn: 'root'
})
export class NewGameService {
  public loadGame: Subject<string> = new Subject();
  private user: User;
  private client: deepstreamIO.Client;

  constructor(private modalService: NgbModal, deepstream: DeepstreamService, auth: AuthService, private notification: NotificationService) {
    this.client = deepstream.getInstance();
    this.user = auth.user;
    this.client.event.subscribe(`message/${this.user.id}`, this.onMessage.bind(this));
  }

  async loadAIGame() {
    this.getRecord(this.user.id).set('status', 'Busy');
    const gameId = await this.createGame(this.user, Bot);
    this.getList('games').addEntry(gameId);
    this.loadGame.next(gameId);
  }

  invite(user: User) {
    if (user.status === 'Online') {
      this.getRecord(user.id).set('status', 'Busy');
      this.send(user.id, new Message(this.user.id, 'Create Game'));
      this.notification.update(`Invitation sent. Waiting for ${user.name}`, 'success');
    }
  }

  sendRematchInvitation(opponentUID: string, gameId: string) {
    this.send(opponentUID, new Message(this.user.id, 'Rematch', { gameId: gameId }));
  }

  private createGame(red: User, yellow: User): Promise<string> {
    return new Promise(resolve => {
      const gameId = this.client.getUid();
      this.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
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

  private onMessage(message: Message) {
    const user: User = this.getRecord(message.senderUID).get();
    switch (message.topic) {
      case 'Create Game':
      case 'Rematch':
        this.respond(message);
        break;
      case 'Accept':
        this.getRecord(this.user.id).set('status', 'In game');
        this.getRecord(user.id).set('status', 'In game');
        this.loadGame.next(message.details.gameId);
        this.notification.update(`${user.name} accepted your invitation`, 'success');
        break;
      case 'Reject':
        this.notification.update(`${user.name} turned down your invitation`, 'warning');
    }
  }

  private respond(message: Message) {
    const userRecord = this.getRecord(message.senderUID);
    let user = userRecord.get();
    const modal = this.modalService.open(GameInvitationComponent);
    modal.componentInstance.user = user;
    modal.result.then(async (option: string) => {
      user = userRecord.get();
      if (user.status === 'Online') {
        if (option === 'Accept') {
          switch (message.topic) {
            case 'Create Game':
              const gameId = await this.createGame(this.user, user);
              this.getList('games').addEntry(gameId);
              this.send(user.id, new Message(this.user.id, 'Accept', { gameId: gameId }));
              this.loadGame.next(gameId);
              break;
            case 'Rematch':
              this.getRecord(message.details.gameId).set('state', 'in progress');
          }
        } else {
          this.send(user.id, new Message(this.user.id, 'Reject'));
          this.getRecord(this.user.id).set('status', 'Online');
        }
      } else {
        this.notification.update(`${user.name} is not available`, 'warning');
      }
    });
  }

  private send(receipientUID: string, message: Message) {
    this.client.event.emit(`message/${receipientUID}`, message);
  }

  private getRecord(recordname: string) {
    return this.client.record.getRecord(recordname);
  }

  private getList(listname: string) {
    return this.client.record.getList(listname);
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
