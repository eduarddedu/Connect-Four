/**
 * PanelPlayers shows online users, updating details such as the status.
 * PanelPlayers also manages game create/rematch invitations.
 */

import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { User } from '../util/models';
import { IntegerSequenceGenerator } from '../util/generators';
import { Game } from '../game/game';
import { NotificationService } from '../notification.service';
import { GameInvitationComponent } from '../modals/game-invitation/game-invitation.component';
import { RealtimeService } from '../realtime.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', './styles.component.css'],
})

export class PanelPlayersComponent implements OnInit, OnDestroy {
  private game: Game;
  private ascendingIntegers: Generator;
  @Input() user: User;
  @Input() users: Map<string, User> = new Map();

  constructor(
    private realtime: RealtimeService, private modalService: NgbModal, private notification: NotificationService) {
    this.ascendingIntegers = IntegerSequenceGenerator(0);
  }

  ngOnInit() {
    this.realtime.users.all.subscribe((users: User[]) => {
      users.forEach(this.addUser.bind(this));
      const userSignedInAnotherDevice = users.map(user => user.id).includes(this.user.id);
      if (!userSignedInAnotherDevice) {
        this.realtime.users.add(this.user);
        window.addEventListener('beforeunload', this.signOut.bind(this));
      }
    });
    this.realtime.users.added.subscribe(this.addUser.bind(this));
    this.realtime.users.removed.subscribe(this.removeUser.bind(this));
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.ourUserPlays) {
        this.game = game;
      }
    });
    this.realtime.games.removed.subscribe((gameId: string) => {
      if (this.game && this.game.id === gameId) {
        this.game = null;
      }
    });
    this.realtime.messages.createGameMessage.subscribe(this.handleCreateGameMessage.bind(this));
    this.realtime.messages.resetGameMessage.subscribe(this.handleResetGameMessage.bind(this));
    this.realtime.messages.acceptMessage.subscribe(this.handleAcceptMessage.bind(this));
    this.realtime.messages.rejectMessage.subscribe(this.handleRejectMessage.bind(this));
  }

  ngOnDestroy() {
    this.signOut();
  }

  private signOut() {
    this.realtime.users.remove(this.user.id);
    const gameInProgress = this.game && this.game.ourUserPlays;
    if (gameInProgress) {
      this.realtime.games.remove(this.game.id);
      if (this.game && !this.game.isAgainstAi) {
        this.realtime.users.setUserStatus(this.game.opponent.id, 'Online');
      }
    }
  }

  onClick(user: User) {
    if (user.status === 'Online') {
      this.realtime.messages.sendCreateGameMessage(user.id);
      this.notification.update(`Invitation sent. Waiting for ${user.name}`, 'success');
    }
  }

  private addUser(user: User) {
    if (user.id !== this.user.id) {
      this.users.set(user.id, Object.assign(user, { index: this.ascendingIntegers.next().value }));
      this.realtime.users.onUserStatusChange(user.id, this.onUserStatusChanged, this);
    }
  }

  private removeUser(userId: string) {
    if (userId !== this.user.id) {
      this.users.delete(userId);
    }
  }

  private onUserStatusChanged(userId: string, status: 'Online' | 'Busy' | 'In game') {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }

  private async handleCreateGameMessage(senderId: string) {
    let sender: User = this.users.get(senderId);
    const option = await this.getUserResponse(sender);
    sender = this.users.get(senderId);
    if (option === 'Accept') {
      if (sender && sender.status === 'Online') {
        this.realtime.messages.sendAcceptMessage(sender.id);
        this.realtime.users.setUserStatus(this.user.id, 'In game');
        this.realtime.users.setUserStatus(sender.id, 'In game');
        this.realtime.games.createGame(this.user, sender);
      } else {
        this.realtime.users.setUserStatus(this.user.id, 'Online');
        this.notification.update(`${sender.name} is not available`, 'warning');
      }
    } else if (option === 'Reject' && sender.status === 'Online') {
      this.realtime.messages.sendRejectMessage(senderId);
    }
  }

  private async handleResetGameMessage() {
    let sender: User = this.game.opponent;
    const option = await this.getUserResponse(sender);
    sender = this.users.get(sender.id);
    if (option === 'Accept') {
      if (sender && sender.status === 'In game') {
        this.realtime.games.updateGameState(this.game.id, 'in progress');
      } else {
        this.realtime.users.setUserStatus(this.user.id, 'Online');
        this.notification.update(`${sender.name} is not available`, 'warning');
      }
    } else if (option === 'Reject' && sender.status === 'In game') {
      this.realtime.messages.sendRejectMessage(sender.id);
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
      const modal = this.modalService.open(GameInvitationComponent);
      modal.componentInstance.user = sender;
      modal.result.then((option: string) => resolve(option));
    });
  }

  descendingSort(a: { key: string, value: User & { index: number } }, b: { key: string, value: User & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}
