import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DeepstreamClientManager } from '../deepstream-client-manager.service';
import { InvitationJoinGameComponent } from '../invitation-join-game/invitation-join-game.component';
import { InvitationRejectedComponent } from '../invitation-rejected/invitation-rejected.component';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-panel-join-game',
  templateUrl: './panel-join-game.component.html',
  styleUrls: ['./panel-join-game.component.css']
})
export class PanelJoinGameComponent implements OnInit {
  @Input() username: string;
  private client: any;
  private listPlayers: { username: string, status: string }[] = [];
  visible = true;

  constructor(private router: Router,
    private modalService: NgbModal,
    private clientManager: DeepstreamClientManager,
    private util: UtilService) {
  }

  ngOnInit() {
    this.client = this.clientManager.getInstance();
    this.client.record.getList('users').whenReady((list: any) => {
      list.getEntries().forEach((username: any) => this.managePlayer(username));
      list.on('entry-added', this.managePlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
    this.client.event.subscribe(`invitations/${this.username}`, this.handleInvitation.bind(this));
  }

  private managePlayer(username: any) {
    if (username === this.username) {
      return;
    }
    this.client.record.getRecord(username).subscribe('status', (status: any) => {
      const user = this.searchListPlayers(username);
      if (user) {
        user.status = status;
      } else {
        this.listPlayers.push({ username: username, status: status });
      }
    });
  }

  private searchListPlayers(username: string) {
    return this.listPlayers.find((u: any) => u.username === username);
  }

  private removePlayer(username: any) {
    const list = this.listPlayers.filter((u: any) => u.username !== username);
    this.util.tick_then(() => this.listPlayers = list);
  }

  onClick(user: any) {
    if (user.status === 'Online') {
      this.client.event.emit(`invitations/${user.username}`, { from: this.username });
      user.status = 'Invited';
    } else if (user.status === 'In game') {
      this.client.record.getRecord(user.username).subscribe('gameId', this.navigateToGame.bind(this), true);
    }
  }

  handleInvitation(data: any) {
    const sender = data.from;
    if (data.response === undefined) {
      this.respondToInvitation(sender);
    } else {
      if (data.response === 'Accept') {
        this.client.record.getRecord(this.username).subscribe('gameId', this.navigateToGame.bind(this), true);
      } else {
        const modalRef = this.modalService.open(InvitationRejectedComponent);
        modalRef.componentInstance.username = sender;
      }
    }
  }

  private navigateToGame(gameId: string) {
    if (gameId) {
      this.router.navigate([`/game/${gameId}`]);
      this.visible = false;
    }
  }

  private respondToInvitation(sender: string) {
    const modalRef = this.modalService.open(InvitationJoinGameComponent);
    modalRef.componentInstance.username = sender;
    modalRef.result.then((response: any) => {
      if (response === 'Accept' && this.getUserStatus(sender) === 'Online') {
        const gameId = this.client.getUid();
        this.setupNewGame(sender, gameId);
        this.navigateToGame(gameId);
      }
      this.client.event.emit(`invitations/${sender}`, { from: this.username, response: response });
    });
  }

  private getUserStatus(username: string): any {
    const user = this.listPlayers.find((u: any) => u.username === username);
    return user ? user.status : null;
  }

  private setupNewGame(opponent: string, gameId: string) {
    this.client.record.getRecord(gameId).set({
      details: {
        redPlayer: this.username,
        yellowPlayer: opponent,
        moves: []
      }
    });
    this.client.record.getRecord(this.username).set('status', 'In game');
    this.client.record.getRecord(this.username).set('gameId', gameId);
    this.client.record.getRecord(opponent).set('status', 'In game');
    this.client.record.getRecord(opponent).set('gameId', gameId);
  }
}
