import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { AuthService } from './auth.service';
import { User, Bot } from './util/user';
import { DeepstreamService } from './deepstream.service';
import { NotificationService } from './notification.service';
import { InvitationRejectedComponent } from './modals/invitation-rejected/invitation-rejected.component';
import { GameInvitationComponent } from './modals/game-invitation/game-invitation.component';

@Injectable({
  providedIn: 'root'
})
export class NewGameService {
  private user: User;
  private client: deepstreamIO.Client;
  private myMessagesReceipientsIDs: Set<String> = new Set();
  public loadGame: Subject<string> = new Subject();

  constructor(private modalService: NgbModal, deepstream: DeepstreamService, auth: AuthService, private notification: NotificationService) {
    this.client = deepstream.getInstance();
    this.user = auth.user;
    this.client.event.subscribe(`message/${this.user.id}`, this.onMessage.bind(this));
  }

  async invite(user: User) {
    if (user === Bot) {
      const gameId = await this.createGameRecord(this.user, Bot);
      this.client.record.getList('games').addEntry(gameId);
      this.loadGame.next(gameId);
    } else {
      if (this.myMessagesReceipientsIDs.has(user.id)) {
        this.notification.update(`Invitation already sent. Waiting for ${user.name}`, 'success');
      } else {
        this.send(user.id, new Message(this.user.id, 'Create Game'));
        this.notification.update(`Invitation sent. Waiting for ${user.name}`, 'success');
        this.myMessagesReceipientsIDs.add(user.id);
      }
    }
  }

  sendRematchInvitation(opponentUID: string, gameId: string) {
    this.send(opponentUID, new Message(this.user.id, 'Rematch', { gameId: gameId }));
  }

  private onMessage(message: Message) {
    const user: User = this.client.record.getRecord(message.senderUID).get();
    switch (message.topic) {
      case 'Create Game':
      case 'Rematch':
        this.respond(message);
        break;
      case 'Accept':
        this.client.record.getRecord(this.user.id).set('status', 'In game');
        this.client.record.getRecord(user.id).set('status', 'In game');
        this.myMessagesReceipientsIDs.delete(message.senderUID);
        this.loadGame.next(message.details.gameId);
        this.notification.update(`${user.name} accepted your invitation`, 'success');
        break;
      case 'Reject':
        const modal = this.modalService.open(InvitationRejectedComponent);
        modal.componentInstance.user = user;
        this.myMessagesReceipientsIDs.delete(message.senderUID);
    }
  }

  private respond(message: Message) {
    const userRecord = this.client.record.getRecord(message.senderUID);
    const user = userRecord.get();
    const modal = this.modalService.open(GameInvitationComponent);
    modal.componentInstance.user = user;
    modal.result.then(async (option: string) => {
      if (!this.client.record.getList('users').getEntries().includes(user.id)) { return; }
      if (option === 'Accept') {
        switch (message.topic) {
          case 'Create Game':
            const gameId = await this.createGameRecord(this.user, user);
            this.client.record.getList('games').addEntry(gameId);
            this.send(user.id, new Message(this.user.id, 'Accept', { gameId: gameId }));
            this.loadGame.next(gameId);
            break;
          case 'Rematch':
            this.client.record.getRecord(message.details.gameId).set('state', 'in progress');
        }
      } else {
        this.send(user.id, new Message(this.user.id, 'Reject'));
      }
    });
  }

  private createGameRecord(red: User, yellow: User): Promise<string> {
    return new Promise(resolve => {
      const gameId = this.client.getUid();
      this.client.record.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
        record.set({
          id: gameId,
          startDate: Date.now(),
          players: {
            red: red,
            yellow: yellow
          },
          redMovesFirst: true,
          state: 'in progress',
          moves: [],
          points: { red: 0, yellow: 0 }
        });
        resolve(gameId);
      });
    });
  }

  private send(receipientUID: string, message: Message) {
    this.client.event.emit(`message/${receipientUID}`, message);
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
