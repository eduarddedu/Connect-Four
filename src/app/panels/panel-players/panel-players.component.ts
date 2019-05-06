/**
 * PanelPlayers manages game invitations and creates the game record.
 */

import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../auth.service';
import { DeepstreamService } from '../../deepstream.service';
import { GameInvitationComponent } from '../../modals/game-invitation/game-invitation.component';
import { InvitationRejectedComponent } from '../../modals/invitation-rejected/invitation-rejected.component';
import { NotificationService } from 'src/app/notification.service';


export interface Invitation {
  from: {
    userId: string;
  };
  topic: 'Create Game' | 'Join Game' | 'Reject' | 'Rematch';
  details?: {
    gameId?: string;
  };
}

@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', '../panels-styles.css']
})

export class PanelPlayersComponent implements OnInit {
  @Input() user: User;
  @Output() joinGame: EventEmitter<string> = new EventEmitter();
  players: Map<string, User> = new Map();
  private botUser: User = {
    id: '0',
    name: 'Bobiță',
    iconUrl: 'assets/img/robot-dog-head.png',
    email: 'bobita@example.com',
    authProvider: null,
    status: 'Online'
  };
  private deepstream: deepstreamIO.Client;


  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private notification: NotificationService,
    ds: DeepstreamService) {
    this.deepstream = ds.getInstance();
    this.players.set('0', this.botUser);
  }

  ngOnInit() {
    this.deepstream.record.getList('users').whenReady((list: any) => {
      list.getEntries().forEach(this.addPlayer.bind(this));
      list.on('entry-added', this.addPlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
    this.deepstream.event.subscribe(`invitations/${this.user.id}`, this.handleInvitationEvent.bind(this));
  }

  onClick(user: User) {
    if (user.id === '0') {
      (this.createGameRecord(this.user, this.botUser)).then((gameId: string) => {
        this.joinGame.emit(gameId);
      });
    } else if (user.status === 'Online') {
      this.deepstream.event.emit(`invitations/${user.id}`, <Invitation>{
        from: { userId: this.user.id }, topic: 'Create Game'
      });
      this.deepstream.record.getRecord(user.id).set('status', 'Busy');
      this.notification.update(`Invitation sent. Waiting for ${user.name}`, 'success');
    }
  }

  private addPlayer(userId: string) {
    if (userId !== this.user.id) {
      this.deepstream.record.getRecord(userId).subscribe((user: User) => {
        if (user.id) {
          this.players.set(user.id, user);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private removePlayer(userId: string) {
    this.players.delete(userId);
    this.cdr.detectChanges();
  }

  handleInvitationEvent(invitation: Invitation) {
    const user = this.players.get(invitation.from.userId);
    if (!user) {
      return;
    }
    if (invitation.topic === 'Create Game' || invitation.topic === 'Rematch') {
      this.getUserResponse(invitation);
    }
    if (invitation.topic === 'Join Game') {
      this.joinGame.emit(invitation.details.gameId);
      this.deepstream.record.getRecord(user.id).set('status', 'Playing');
      this.notification.update(`${user.name} accepted your invitation`, 'success');
    }
    if (invitation.topic === 'Reject') {
      const modalRef = this.modalService.open(InvitationRejectedComponent);
      modalRef.componentInstance.user = user;
    }
  }

  private getUserResponse(invitation: Invitation) {
    let user = this.players.get(invitation.from.userId);
    const modalRef = this.modalService.open(GameInvitationComponent);
    modalRef.componentInstance.user = user;
    modalRef.result.then((option: any) => {
      user = this.players.get(invitation.from.userId);
      if (!user) {
        this.notification.update(`${user.name} went offline`, 'warning');
        return;
      }
      if (option === 'Join Game') {
        if (invitation.topic === 'Create Game') {
          this.createAndJoinGame(user);
        } else if (invitation.topic === 'Rematch') {
          this.deepstream.record.getRecord(invitation.details.gameId).set('state', 'in progress');
        }
        this.deepstream.record.getRecord(user.id).set('status', 'Playing');
      }
      if (option === 'Reject') {
        this.deepstream.event.emit(`invitations/${user.id}`, <Invitation>{
          from: { userId: this.user.id }, topic: 'Reject'
        });
      }
    });
  }

  private createAndJoinGame(opponent: User) {
    this.createGameRecord(this.user, opponent).then((gameId: string) => {
      this.deepstream.event.emit(`invitations/${opponent.id}`, <Invitation>{
        from: { userId: this.user.id }, topic: 'Join Game', details: { gameId: gameId }
      });
      this.joinGame.emit(gameId);
    });
  }

  private createGameRecord(red: User, yellow: User): Promise<string> {
    return new Promise(resolve => {
      const gameId = this.deepstream.getUid();
      this.deepstream.record.getRecord(gameId).whenReady((record: deepstreamIO.Record) => {
        record.set({
          id: gameId,
          createdOn: Date.now(),
          players: {
            red: red,
            yellow: yellow
          },
          state: 'in progress',
          moves: [],
          points: { red: 0, yellow: 0 }
        });
        this.deepstream.record.getList('games').addEntry(gameId);
        resolve(gameId);
      });
    });
  }

}

