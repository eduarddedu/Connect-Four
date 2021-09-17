import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../util/models';
import { IntegerSequenceGenerator } from '../util/generators';
import { NotificationService } from '../services/notification.service';
import { GameCreateComponent } from '../game-create.component/game-create.component';
import { GameInvitationComponent } from '../game-invitation.component/game-invitation.component';
import { RealtimeService } from '../services/realtime.service';
import { State } from '../game/engine';

@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css'],
})

export class PanelPlayersComponent implements OnInit {
  private ascendingIntegers: Generator;
  @Input() user: User;
  @Input() users: Map<string, User> = new Map();

  constructor(
    private realtime: RealtimeService, private modalService: NgbModal, private notification: NotificationService) {
    this.ascendingIntegers = IntegerSequenceGenerator(0);
  }

  ngOnInit() {
    this.realtime.users.all.subscribe((users: User[]) => {
      users.forEach((user: User) => {
        if (user.id !== this.user.id) {
          this.onUserOnline(user);
        }
      });
      this.realtime.users.added.subscribe(this.onUserOnline.bind(this));
      this.realtime.users.removed.subscribe(this.onUserOffline.bind(this));
      this.realtime.messages.createGame.subscribe(this.handleCreateGameMessage.bind(this));
      this.realtime.messages.accept.subscribe(this.handleAcceptMessage.bind(this));
      this.realtime.messages.reject.subscribe(this.handleRejectMessage.bind(this));
    });
  }

  private onUserOnline(user: User) {
    if (user.id !== this.user.id) {
      this.users.set(user.id, Object.assign(user, {
        index: this.ascendingIntegers.next().value
      }));
      this.realtime.users.onUserStatusChange(user.id, this.onUpdateUserStatus, this);
    }
  }

  private onUserOffline(userId: string) {
    this.users.delete(userId);
  }

  private onUpdateUserStatus(userId: string, status: 'Online' | 'Invited' | 'In game') {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }

  private async handleCreateGameMessage(data: { senderId: string, senderPlaysRed: boolean, redMovesFirst: boolean }) {
    let sender: User = this.users.get(data.senderId);
    const senderName = sender.name;
    const option = await this.getUserResponse(sender);
    sender = this.users.get(data.senderId);
    switch (option) {
      case 'Accept':
        if (sender && sender.status === 'Online') {
          this.realtime.messages.sendAcceptMessage(sender.id);
          this.realtime.users.setUserStatus(this.user.id, 'In game');
          this.realtime.users.setUserStatus(sender.id, 'In game');
          const initialState = data.redMovesFirst ? State.RED_MOVES : State.YELLOW_MOVES;
          const redPlayer: User = data.senderPlaysRed ? sender : this.user;
          const yellowPlayer: User = data.senderPlaysRed ? this.user : sender;
          this.realtime.games.createGame(redPlayer, yellowPlayer, initialState);
        } else {
          this.realtime.users.setUserStatus(this.user.id, 'Online');
          this.notification.update(`${senderName} is not available`, 'warning');
        }
        break;
      case 'Reject':
        if (sender && sender.status === 'Online') {
          this.realtime.messages.sendRejectMessage(data.senderId);
          this.realtime.users.setUserStatus(this.user.id, 'Online');
        }
    }
  }

  private handleAcceptMessage(senderId: string) {
    const sender = this.users.get(senderId);
    this.notification.update(`${sender.name} has accepted your invitation`, 'success');
  }

  private handleRejectMessage(senderId: string) {
    const sender = this.users.get(senderId);
    this.notification.update(`${sender.name} has rejected your invitation`, 'warning');
  }

  private getUserResponse(sender: User): Promise<string> {
    this.realtime.users.setUserStatus(this.user.id, 'Invited');
    return new Promise(resolve => {
      const modal = this.modalService.open(GameInvitationComponent, { backdrop: 'static' });
      modal.componentInstance.user = sender;
      modal.result.then((option: string) => resolve(option));
    });
  }

  onClick(user: User) {
    if (user.status === 'Online') {
      this.realtime.users.setUserStatus(this.user.id, 'Invited');
      const modal = this.modalService.open(GameCreateComponent);
      modal.componentInstance.user = this.user;
      modal.componentInstance.opponent = user;
      modal.result.then((option: 'Cancel' | { userPlaysRed: boolean, redMovesFirst: boolean }) => {
        if (typeof option === 'object') {
          this.realtime.messages.sendCreateGameMessage(user.id, option.userPlaysRed, option.redMovesFirst);
          this.notification.update(`${user.name} has been invited.`, 'success');
        }
        this.realtime.users.setUserStatus(this.user.id, 'Online');
      });
    }
  }

  descendingSort(a: { key: string, value: User & { index: number } }, b: { key: string, value: User & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}
