/**
 * HomeComponent initates a game against the AI and handles clicks on the (app) logo button,
 * which serves to close the game and navigate back to the home page.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../auth.service';
import { User, Bot } from '../util/models';
import { CreateGameComponent } from '../modals/create-game/create-game.component';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
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
      if (this.game && this.game.id === id) {
        this.showPanels = true;
        this.game = null;
      }
    });
  }

  onClickBot() {
    this.realtime.users.setUserStatus(this.user.id, 'Busy');
    const modal = this.modalService.open(CreateGameComponent, { backdrop: 'static' });
    modal.componentInstance.user = this.user;
    modal.componentInstance.opponent = Bot;
    modal.componentInstance.userPlaysRed = true;
    modal.result.then((option: any) => {
      if (typeof option === 'object') {
        this.realtime.users.setUserStatus(this.user.id, 'In game');
        switch (option.userPlaysRed) {
          case true: this.realtime.games.createGame(this.user, Bot, true); break;
          case false: this.realtime.games.createGame(Bot, this.user, false);
        }
      } else if (option === 'Cancel') {
        this.realtime.users.setUserStatus(this.user.id, 'Online');
      }
    });
  }

  onClickLogo() {
    if (this.game) {
      this.closeGameView();
    }
  }

  private async closeGameView() {
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
        this.gameComponent.quitGame();
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
