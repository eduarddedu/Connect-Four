import { Component, OnInit, Input, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DeepstreamClientManager } from '../../deepstream-client-manager.service';
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
  private listPlayers: Player[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private clientManager: DeepstreamClientManager) {
  }

  ngOnInit() {
    this.deepstream = this.clientManager.getInstance();
    this.deepstream.record.getList('users').whenReady((list: any) => {
      this.addPlayers(list.getEntries());
      list.on('entry-added', this.addPlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
    this.deepstream.event.subscribe(`invitations/${this.username}`, this.handleInvitationEvent.bind(this));
  }

  private addPlayers(list: string[]) {
    list.filter(username => username !== this.username).forEach(username => {
      const player: Player = { username: username, status: 'Online' };
      this.listPlayers.push(player);
    });
    this.cdr.detectChanges();
  }

  private addPlayer(username: string) {
    if (username !== this.username) {
      const newPlayer: Player = { username: username, status: 'Online' };
      this.listPlayers.push(newPlayer);
      this.cdr.detectChanges();
    }
  }

  private removePlayer(username: string) {
    this.listPlayers = this.listPlayers.filter(player => player.username !== username);
    this.cdr.detectChanges();
  }

  private onClick(player: Player) {
    if (player.status === 'Online') {
      player.status = 'Invited';
      this.deepstream.event.emit(`invitations/${player.username}`, <Invitation>{ sender: this.username });
      this.cdr.detectChanges();
    }
  }

  handleInvitationEvent(invitation: Invitation) {
    if (invitation.response === undefined) {
      this.showInvitation(invitation.sender);
    } else {
      if (invitation.response === 'Accept') {
        this.invitationAccepted.emit({ gameId: invitation.gameId, invitee: invitation.sender });
        this.clientManager.addGame(invitation.gameId);
        this.listPlayers.find(p => p.username === invitation.sender).status = 'Playing';
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
        if (this.listPlayers.find(p => p.username === sender)) {
          this.createAndJoinGame(sender);
          this.listPlayers.find(p => p.username === sender).status = 'Playing';
          this.cdr.detectChanges();
        } else {
          this.invitationSenderOffline.emit(sender);
        }
      } else if (option === 'Reject') {
        this.deepstream.event.emit(`invitations/${sender}`, { sender: this.username, response: 'Reject' });
      }
    });
  }

  private createAndJoinGame(sender: string) {
    const gameId = this.createGameRecord(sender);
    this.deepstream.event.emit(`invitations/${sender}`, {
      sender: this.username,
      response: 'Accept',
      gameId: gameId
    });
    this.invitationAccepted.emit({ gameId: gameId });
    this.clientManager.addGame(gameId);
  }

  /*
  The invited party creates the game record. As a courtesy, it gets to play red and move first.
  */

  private createGameRecord(opponent: string): string {
    const gameId = this.deepstream.getUid();
    const record = this.deepstream.record.getRecord(gameId);
    record.set({
      players: {
        red: {
          color: '#ff010b',
          username: this.username
        },
        yellow: {
          color: '#ffd918',
          username: opponent
        }
      },
      game: {
        state: 'in progress',
        moves: []
      },
      points: { red: 0, yellow: 0 },
      gameId: gameId
    });
    this.deepstream.record.getList('games').addEntry(gameId);
    return gameId;
  }

}

interface Player {
  username: string; status: string;
}

interface Invitation {
  sender: string; response?: string; gameId?: string;
}

