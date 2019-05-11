import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService, User } from '../auth.service';
import { DeepstreamService } from '../deepstream.service';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { NotificationService } from '../notification.service';
import { GameComponent } from '../game/game.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild(GameComponent) gc: GameComponent;
  user: User;
  showPanels = true;
  showPopoverMenu = false;
  private client: deepstreamIO.Client;

  constructor(private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private deepstream: DeepstreamService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    if (this.auth.currentUser) {
      this.user = this.auth.currentUser;
      this.client = this.deepstream.getInstance();
      this.client.record.getList('users').whenReady(list => {
        if (!list.getEntries().includes(this.user.id)) {
          list.addEntry(this.user.id);
          this.client.record.getRecord(this.user.id).set(this.user);
          window.addEventListener('beforeunload', this.signoutDeepstream.bind(this));
        }
      });
      this.client.record.getList('games').on('entry-removed', this.onGameRecordDelete.bind(this));
    } else {
      this.router.navigate(['/login']);
    }
  }

  closeGameView() {
    if (this.gc.game && this.gc.isPlayer && this.gc.record) {
      this.getGameQuitConsent();
    } else {
      this.gc.unloadGame();
      this.showPanels = true;
    }
  }

  getGameQuitConsent() {
    const modalRef = this.modalService.open(QuitGameComponent);
    modalRef.result.then((option: string) => {
      if (option === 'Yes') {
        const game = this.gc.game;
        this.gc.unloadGame();
        this.showPanels = true;
        this.client.record.getRecord(this.user.id).set('status', 'Online');
        if (!game.isAgainstAi) {
          this.client.record.getRecord(this.gc.opponent.id).set('status', 'Online');
        }
        this.client.record.getList('games').removeEntry(game.id);
        this.client.record.getRecord(game.id).delete();
      }
    });
  }

  loadGame(gameId: string) {
    this.showPanels = false;
    this.gc.loadGame(gameId);
  }

  onGameRecordDelete(gameId: string) {
    if (this.gc.game && this.gc.game.id === gameId) {
      this.notification.update(`Game over. Opponent abandoned`, 'danger');
      this.gc.record = null;
    }
  }

  signout() {
    this.auth.signout();
    this.signoutDeepstream();
  }

  signoutDeepstream() {
    this.client.record.getRecord(this.user.id).delete();
    this.client.record.getList('users').removeEntry(this.user.id);
    if (this.gc.game && this.gc.isPlayer && this.gc.record) {
      this.client.record.getRecord(this.gc.game.id).delete();
      this.client.record.getList('games').removeEntry(this.gc.game.id);
    }
    this.client.close();
  }

}

/**
 * HomeComponent handles disruptive events such as user signout, user closing the browser window or user navigating
 * out of the game view.
 */
