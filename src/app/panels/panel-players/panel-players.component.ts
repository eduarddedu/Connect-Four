import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../auth.service';
import { DeepstreamService } from '../../deepstream.service';
import { GameInvitationComponent } from '../../invitations/game-invitation/game-invitation.component';
import { InvitationRejectedComponent } from '../../invitations/invitation-rejected/invitation-rejected.component';
import { NotificationService } from 'src/app/notification.service';


type Player = User & { status: string; };

interface Invitation {
  userId: string; response?: string; gameId?: string;
}

@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', '../panels-styles.css']
})

export class PanelPlayersComponent implements OnInit {
  @Input() user: User;
  @Input() panelVisible = true;
  @Output() joinGame: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  private players: Player[] = [];
  private myGames: Set<string> = new Set();

  constructor(private cdr: ChangeDetectorRef, private modalService: NgbModal,
    ds: DeepstreamService, private notification: NotificationService) {
    this.deepstream = ds.getInstance();
    window.addEventListener('beforeunload', this.removeGameRecords.bind(this));
  }

  ngOnInit() {
    this.deepstream.record.getList('users').whenReady((list: any) => {
      list.getEntries().forEach(this.addPlayer.bind(this));
      list.on('entry-added', this.addPlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
    this.deepstream.event.subscribe(`invitations/${this.user.id}`, this.handleInvitationEvent.bind(this));
  }

  onClick(player: Player) {
    if (player.status === 'Online') {
      player.status = 'Invited';
      this.cdr.detectChanges();
      this.deepstream.event.emit(`invitations/${player.id}`, <Invitation>{ userId: this.user.id });
    }
  }

  private addPlayer(userId: string) {
    if (userId && userId !== this.user.id) {
      const record = this.deepstream.record.getRecord(userId);
      const pushPlayer = (user: User) => {
        if (user.id) {
          const player: Player = Object.assign(user, { status: 'Online' });
          this.players.push(player);
          this.cdr.detectChanges();
          record.unsubscribe(pushPlayer);
        }
      };
      record.subscribe(pushPlayer, true);
    }
  }

  private removePlayer(userId: string) {
    this.players = this.players.filter(player => player.id !== userId);
    this.cdr.detectChanges();
  }

  handleInvitationEvent(invitation: Invitation) {
    if (invitation.response === undefined) {
      this.showInvitation(invitation);
    } else {
      const user = this.players.find(p => p.id === invitation.userId);
      if (invitation.response === 'Accept') {
        this.joinGame.emit(invitation.gameId);
        this.notification.update(`${user.name} has accepted your invitation.`, 'success');
        this.myGames.add(invitation.gameId);
        user.status = 'Playing';
        this.cdr.detectChanges();
      } else if (invitation.response === 'Reject') {
        const modalRef = this.modalService.open(InvitationRejectedComponent);
        modalRef.componentInstance.user = user;
      }
    }
  }

  private showInvitation(invitation: Invitation) {
    const user = this.players.find(p => p.id === invitation.userId);
    if (user) {
      const modalRef = this.modalService.open(GameInvitationComponent);
      modalRef.componentInstance.user = user;
      modalRef.result.then((option: any) => {
        if (option === 'Join Game') {
          if (this.players.includes(user)) {
            this.createAndJoinGame(user);
            user.status = 'Playing';
            this.cdr.detectChanges();
          } else {
            this.notification.update(`${user.name} went offline`, 'info');
          }
        } else if (option === 'Reject') {
          this.deepstream.event.emit(`invitations/${user.id}`, <Invitation>{ userId: this.user.id, response: 'Reject' });
        }
      });
    }
  }

  /*
  The invited party creates the game record. As a courtesy, we get to play red and move first.
  */

  private createAndJoinGame(opponent: User) {
    const gameId = this.createGameRecord(this.user, opponent);
    this.myGames.add(gameId);
    this.deepstream.event.emit(`invitations/${opponent.id}`, <Invitation>{
      userId: this.user.id,
      response: 'Accept',
      gameId: gameId
    });
    this.joinGame.emit(gameId);
  }

  private createGameRecord(red: User, yellow: User): string {
    const gameId = this.deepstream.getUid();
    this.deepstream.record.getList('games').addEntry(gameId);
    const record = this.deepstream.record.getRecord(gameId);
    record.set({
      id: gameId,
      createdOn: Date.now(),
      players: {
        red: red,
        yellow: yellow
      },
      state: 'in progress',
      moves: [],
      points: { red: 0, yellow: 0 },
      redMovesFirst: true,
      activeColor: 'red'
    });
    return gameId;
  }

  private removeGameRecords() {
    this.myGames.forEach(gameId => {
      this.deepstream.record.getRecord(gameId).delete();
      this.deepstream.record.getList('games').removeEntry(gameId);
    });
  }

}

