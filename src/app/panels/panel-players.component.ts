/**
 * PanelPlayers shows online users, updating details such as the status and
 * provides the mechanism to initiate a game, by clicking on a user in list.
 */

import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../util/models';
import { IntegerSequenceGenerator } from '../util/generators';
import { NotificationService } from '../notification.service';
import { GameCreateComponent } from '../modals/game-create.component';
import { GameInvitationComponent } from '../modals/game-invitation.component';
import { RealtimeService } from '../realtime.service';


@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', './styles.component.css'],
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
      users.forEach(this.onUserOnline.bind(this));
      const alreadySigned = users.map(user => user.id).includes(this.user.id);
      if (!alreadySigned) {
        this.realtime.users.add(this.user);
        window.addEventListener('beforeunload', () => this.realtime.users.remove(this.user.id));
      }
    });
    this.realtime.users.added.subscribe(this.onUserOnline.bind(this));
    this.realtime.users.removed.subscribe(this.onUserOffline.bind(this));
    this.realtime.messages.createGame.subscribe(this.handleCreateGameMessage.bind(this));
    this.realtime.messages.accept.subscribe(this.handleAcceptMessage.bind(this));
    this.realtime.messages.reject.subscribe(this.handleRejectMessage.bind(this));
  }

  onClick(user: User) {
    if (user.status === 'Online') {
      this.realtime.users.setUserStatus(this.user.id, 'Busy');
      const modal = this.modalService.open(GameCreateComponent);
      modal.componentInstance.user = this.user;
      modal.componentInstance.opponent = user;
      modal.result.then((option: 'Cancel' | { userPlaysRed: boolean }) => {
        if (typeof option === 'object') {
          this.realtime.messages.sendCreateGameMessage(user.id, option.userPlaysRed);
          this.notification.update(`Invitation sent. Waiting on ${user.name}...`, 'success');
        }
        this.realtime.users.setUserStatus(this.user.id, 'Online');
      });
    }
  }

  private onUserOnline(user: User) {
    if (user.id !== this.user.id) {
      this.users.set(user.id, Object.assign(user, { index: this.ascendingIntegers.next().value }));
      this.realtime.users.onUserStatusChange(user.id, this.onUpdateUserStatus, this);
    }
  }

  private onUserOffline(userId: string) {
    this.users.delete(userId);
  }

  private onUpdateUserStatus(userId: string, status: 'Online' | 'Busy' | 'In game') {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }

  private async handleCreateGameMessage(data: { senderId: string, senderPlaysRed: boolean }) {
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
          if (data.senderPlaysRed) {
            this.realtime.games.createGame(sender, this.user, false);
          } else {
            this.realtime.games.createGame(this.user, sender, true);
          }
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
    this.realtime.users.setUserStatus(this.user.id, 'Busy');
    return new Promise(resolve => {
      const modal = this.modalService.open(GameInvitationComponent, { backdrop: 'static' });
      modal.componentInstance.user = sender;
      modal.result.then((option: string) => resolve(option));
    });
  }

  descendingSort(a: { key: string, value: User & { index: number } }, b: { key: string, value: User & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}
