/**
 * HomeComponent handles disruptive events such as signout, user closing the browser window or the
 * game view.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../auth.service';
import { User, Bot } from '../util/models';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { NotificationService } from '../notification.service';
import { Game } from '../game/game';
import { GameComponent } from '../game/game.component';
import { RealtimeService } from '../realtime.service';
import { WatchGameService } from '../watch-game.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: User;
  game: Game;
  Bot: User = Bot;
  showPopoverMenu = false;
  showPanels = true;
  @ViewChild(GameComponent) gameComponent: GameComponent;

  constructor(
    private modalService: NgbModal,
    private auth: AuthService,
    private notification: NotificationService,
    private realtime: RealtimeService,
    private watchGame: WatchGameService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.ourUserPlays) {
        this.game = game;
        this.showPanels = false;
      }
    });
    this.watchGame.selected.subscribe((game: Game) => {
      this.game = game;
      this.showPanels = false;
    });
    this.realtime.games.removed.subscribe(id => {
      const gameAbandonedByOther = this.game && this.game.id === id;
      if (gameAbandonedByOther) {
        this.showPanels = true;
        this.game = null;
        this.notification.update(`Game abandoned by player`, 'danger');
      }
    });
  }

  onClickBot() {
    this.realtime.users.setUserStatus(this.user.id, 'In game');
    this.realtime.games.createGame(this.user, Bot);
  }

  async closeGameView() {
    if (!this.game) { return; }
    if (this.game.ourUserPlays) {
      const option = await this.quitGameResponse();
      if (option === 'Quit') {
        const game = this.game;
        this.game = null;
        this.showPanels = true;
        this.realtime.users.setUserStatus(this.user.id, 'Online');
        if (!game.isAgainstAi) {
          this.realtime.users.setUserStatus(game.opponent.id, 'Online');
        }
        this.realtime.games.remove(game.id);
      }
    } else {
      this.game = null;
      this.showPanels = true;
      this.gameComponent.quitGame();
    }
  }

  private quitGameResponse(): Promise<string> {
    return new Promise(resolve => {
      const modal = this.modalService.open(QuitGameComponent);
      modal.result.then((option: string) => resolve(option));
    });
  }

  signout() {
    this.auth.signout();
  }
}
