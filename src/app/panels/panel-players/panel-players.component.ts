import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DeepstreamService } from '../../deepstream.service';
import { GameInvitationComponent } from '../../invitations/game-invitation/game-invitation.component';
import { InvitationRejectedComponent } from '../../invitations/invitation-rejected/invitation-rejected.component';

@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', '../panels-styles.css']
})

export class PanelPlayersComponent implements OnInit {
  @Input() username: string;
  @Input() panelVisible = true;
  @Output() invitationAccepted: EventEmitter<{ gameId: string, invitee?: string }> = new EventEmitter();
  @Output() invitationSenderOffline: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  private players: Player[] = [];
  private games: Set<string> = new Set();

  constructor(private cdr: ChangeDetectorRef, private modalService: NgbModal, private ds: DeepstreamService) {
    this.deepstream = ds.getInstance();
    window.addEventListener('beforeunload', this.removeGameRecords.bind(this));
  }

  ngOnInit() {
    this.deepstream.record.getList('users').whenReady((users: any) => {
      this.addPlayers(users.getEntries());
      users.on('entry-added', this.addPlayer.bind(this));
      users.on('entry-removed', this.removePlayer.bind(this));
    });
    this.deepstream.event.subscribe(`invitations/${this.username}`, this.handleInvitationEvent.bind(this));
  }

  onClick(player: Player) {
    if (player.status === 'Online') {
      player.status = 'Invited';
      this.deepstream.event.emit(`invitations/${player.username}`, <Invitation>{ sender: this.username });
    }
  }

  private addPlayers(users: string[]) {
    users.filter(username => username !== this.username).forEach(username => {
      const player: Player = { username: username, status: 'Online' };
      this.players.push(player);
    });
    this.cdr.detectChanges();
  }

  private addPlayer(username: string) {
    if (username !== this.username) {
      const newPlayer: Player = { username: username, status: 'Online' };
      this.players.push(newPlayer);
      this.cdr.detectChanges();
    }
  }

  private removePlayer(username: string) {
    this.players = this.players.filter(player => player.username !== username);
    this.cdr.detectChanges();
  }

  handleInvitationEvent(invitation: Invitation) {
    if (invitation.response === undefined) {
      this.showInvitation(invitation.sender);
    } else {
      if (invitation.response === 'Accept') {
        this.invitationAccepted.emit({ gameId: invitation.gameId, invitee: invitation.sender });
        this.games.add(invitation.gameId);
        this.players.find(p => p.username === invitation.sender).status = 'Playing';
        this.cdr.detectChanges();
      } else if (invitation.response === 'Reject') {
        const modalRef = this.modalService.open(InvitationRejectedComponent);
        modalRef.componentInstance.username = invitation.sender;
      }
    }
  }

  private showInvitation(sender: string) {
    const modalRef = this.modalService.open(GameInvitationComponent);
    modalRef.componentInstance.username = sender;
    modalRef.result.then((option: any) => {
      if (option === 'Join Game') {
        if (this.players.find(p => p.username === sender)) {
          this.createAndJoinGame(sender);
          this.players.find(p => p.username === sender).status = 'Playing';
          this.cdr.detectChanges();
        } else {
          this.invitationSenderOffline.emit(sender);
        }
      } else if (option === 'Reject') {
        this.deepstream.event.emit(`invitations/${sender}`, { sender: this.username, response: 'Reject' });
      }
    });
  }

  /*
  As the invited party, we create the game record. As a courtesy, we get to play red and move first.
  */

  private createAndJoinGame(sender: string) {
    const gameId = this.createGameRecord(this.username, sender);
    this.deepstream.event.emit(`invitations/${sender}`, {
      sender: this.username,
      response: 'Accept',
      gameId: gameId
    });
    this.invitationAccepted.emit({ gameId: gameId });
    this.games.add(gameId);
  }

  private createGameRecord(redPlayer: string, yellowPlayer: string): string {
    const gameId = this.deepstream.getUid();
    this.deepstream.record.getList('games').addEntry(gameId);
    const record = this.deepstream.record.getRecord(gameId);
    record.set({
      players: {
        red: {
          color: '#ff010b',
          username: redPlayer
        },
        yellow: {
          color: '#ffd918',
          username: yellowPlayer
        }
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
    this.games.forEach(gameId => {
      this.deepstream.record.getRecord(gameId).delete();
      this.deepstream.record.getList('games').removeEntry(gameId);
    });
  }

}

interface Player {
  username: string; status: string;
}

interface Invitation {
  sender: string; response?: string; gameId?: string;
}

