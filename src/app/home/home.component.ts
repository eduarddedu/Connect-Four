import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../auth.service';
import { User } from '../util/user';
import { DeepstreamService } from '../deepstream.service';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { NotificationService } from '../notification.service';
import { GameComponent } from '../game/game.component';
import { NewGameService } from '../new-game.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild(GameComponent) gc: GameComponent;
  user: User;
  showPanels = true;
  showPopoverMenu = false;
  client: deepstreamIO.Client;

  constructor(
    private modalService: NgbModal,
    private auth: AuthService,
    private deepstream: DeepstreamService,
    private notification: NotificationService,
    private newGame: NewGameService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.client = this.deepstream.getInstance();
    this.client.record.getList('users').whenReady(list => {
      if (!list.getEntries().includes(this.user.id)) {
        list.addEntry(this.user.id);
        this.client.record.getRecord(this.user.id).set(this.user);
        window.addEventListener('beforeunload', this.signoutDeepstream.bind(this));
      }
    });
    this.client.record.getList('games').on('entry-removed', this.onGameRecordDelete.bind(this));
    this.newGame.loadGame.subscribe(this.loadGame.bind(this));
  }

  ngAfterViewInit() {
    // this.notification.update('A notification', 'info');
  }

  loadGame(gameId: string) {
    const record = this.client.record.getRecord(gameId);
    const loadOnce = (data: any) => {
      if (data.id) {
        this.showPanels = false;
        this.gc.loadGame(data);
        record.unsubscribe(loadOnce);
      }
    };
    record.subscribe(loadOnce, true);
  }

  onGameRecordDelete(gameId: string) {
    if (this.gc.game && this.gc.game.id === gameId) {
      this.notification.update(`Game abandoned by player`, 'danger');
      this.gc.record = null;
    }
  }

  closeGameView() {
    if (this.gc.game && this.gc.isPlayer && this.gc.record) {
      this.confirmGameQuit();
    } else {
      this.gc.unloadGame();
      this.showPanels = true;
    }
  }

  confirmGameQuit() {
    const modal = this.modalService.open(QuitGameComponent);
    modal.result.then((option: string) => {
      if (option === 'Quit') {
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
      this.client.record.getRecord(this.gc.opponent.id).set('status', 'Online');
    }
    this.client.close();
  }

}

/**
 * HomeComponent handles disruptive events such as user signout, user closing the browser window or user navigating
 * out of the game view.
 */
