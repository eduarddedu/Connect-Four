import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../auth.service';
import { User, Bot } from '../util/user';
import { DeepstreamService } from '../deepstream.service';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { NotificationService } from '../notification.service';
import { NewGameService } from '../new-game.service';
import { Game } from '../game/game';
import { GameComponent } from '../game/game.component';

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
    private newGame: NewGameService, private deepstream: DeepstreamService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.newGame.subject.subscribe((game: Game) => {
      this.game = game;
      this.showPanels = false;
    });
    this.deepstream.getList('games').on('entry-removed', id => {
      const gameAbandonedByOther = this.game && this.game.id === id;
      if (gameAbandonedByOther) {
        this.showPanels = true;
        this.game = null;
        this.notification.update(`Game abandoned by player`, 'danger');
      }
    });
  }

  onClickBot() {
    this.newGame.pushAiGame();
  }

  closeGameView() {
    if (!this.game) { return; }
    if (this.game.ourUserPlays) {
      const modal = this.modalService.open(QuitGameComponent);
      modal.result.then((option: string) => {
        if (option === 'Quit') {
          const game = this.game;
          this.game = null;
          this.showPanels = true;
          this.deepstream.getRecord(this.user.id).set('status', 'Online');
          if (!game.isAgainstAi) {
            this.deepstream.getRecord(game.opponent.id).set('status', 'Online');
          }
          this.deepstream.getList('games').removeEntry(game.id);
          this.deepstream.getRecord(game.id).delete();
        }
      });
    } else {
      this.game = null;
      this.showPanels = true;
      this.gameComponent.quitGame();
    }
  }

  signout() {
    this.auth.signout();
  }
}

/**
 * HomeComponent handles disruptive events such as signout, user closing the browser window or the
 * game view.
 */
