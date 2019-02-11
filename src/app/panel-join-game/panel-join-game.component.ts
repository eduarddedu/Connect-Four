import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';

import { DeepstreamClientManager } from '../deepstream-client-manager.service';
import { InvitationJoinGameComponent } from '../invitation-join-game/invitation-join-game.component';
import { InvitationRejectedComponent } from '../invitation-rejected/invitation-rejected.component';

@Component({
  selector: 'app-panel-join-game',
  templateUrl: './panel-join-game.component.html',
  styleUrls: ['./panel-join-game.component.css']
})
export class PanelJoinGameComponent implements OnInit, OnDestroy {
  @Input() username: string;
  private client: any;
  private listPlayers: { username: string, status: string }[] = [];
  private subscription: Subscription;
  visible = true;

  constructor(private router: Router,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private clientManager: DeepstreamClientManager) {
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
    this.listPlayers = this.listPlayers.filter((u: any) => u.username !== username);
    this.cdr.detectChanges();
  }

  onClick(user: any) {
    if (user.status === 'Online' && this.client.record.getRecord(this.username).get('status') === 'Online') {
      this.client.event.emit(`invitations/${user.username}`, { from: this.username });
      user.status = 'Invited';
      this.cdr.detectChanges();
    }
    if (user.status === 'In game') {
      this.joinGame(this.client.record.getRecord(user.username).get('gameId'));
    }
  }

  handleInvitation(data: any) {
    const sender = data.from;
    if (data.response === undefined) {
      this.respondToInvitation(sender);
    } else {
      if (data.response === 'Accept') {
        this.client.record.getRecord(this.username).subscribe('gameId', this.joinGame.bind(this), true);
      } else {
        const modalRef = this.modalService.open(InvitationRejectedComponent);
        modalRef.componentInstance.username = sender;
      }
    }
  }

  private joinGame(gameId: string) {
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
        this.joinGame(gameId);
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
      players: {
        red: {
          color: '#ff010b',
          username: this.username,
          points: 0
        },
        yellow: {
          color: '#ffd918',
          username: opponent,
          points: 0
        }
      },
      moves: []
    });
    this.client.record.getRecord(this.username).set('status', 'In game');
    this.client.record.getRecord(this.username).set('gameId', gameId);
    this.client.record.getRecord(opponent).set('status', 'In game');
    this.client.record.getRecord(opponent).set('gameId', gameId);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
