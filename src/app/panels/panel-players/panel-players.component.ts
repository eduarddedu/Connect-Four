import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../auth.service';
import { DeepstreamService } from '../../deepstream.service';
import { GameInvitationComponent } from '../../invitations/game-invitation/game-invitation.component';
import { InvitationRejectedComponent } from '../../invitations/invitation-rejected/invitation-rejected.component';


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
  @Output() invitationAccepted: EventEmitter<{ gameId: string, username?: string }> = new EventEmitter();
  @Output() invitationSenderOffline: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  private players: Player[] = [];
  private myGames: Set<string> = new Set();

  constructor(private cdr: ChangeDetectorRef, private modalService: NgbModal, ds: DeepstreamService) {
    this.deepstream = ds.getInstance();
    window.addEventListener('beforeunload', this.removeGameRecords.bind(this));
  }

  ngOnInit() {
    this.deepstream.record.getList('users').whenReady((users: any) => {
      users.getEntries().forEach(this.addPlayer.bind(this));
      users.on('entry-added', this.addPlayer.bind(this));
      users.on('entry-removed', this.removePlayer.bind(this));
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
        this.invitationAccepted.emit({ gameId: invitation.gameId, username: user.name });
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
            this.invitationSenderOffline.emit(user.name);
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
    this.invitationAccepted.emit({ gameId: gameId });
  }

  private createGameRecord(red: User, yellow: User): string {
    const gameId = this.deepstream.getUid();
    this.deepstream.record.getList('games').addEntry(gameId);
    const record = this.deepstream.record.getRecord(gameId);
    record.set({
      players: {
        red: Object.assign(red, { color: '#ff010b' }),
        yellow: Object.assign(yellow, { color: '#ffd918' })
      },
      game: {
        state: 'in progress',
        moves: []
      },
      points: { red: 0, yellow: 0 },
      gameId: gameId
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

