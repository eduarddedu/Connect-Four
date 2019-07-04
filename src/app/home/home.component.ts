/**
 * HomeComponent initates a game against the AI and handles clicks on the (app) logo button,
 * which serves to close the game and navigate back to the home page.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../auth.service';
import { User, Bot } from '../util/models';
import { GameCreateComponent } from '../modals/game-create.component';
import { GameQuitComponent } from '../modals/game-quit.component';
import { Game } from '../game/game';
import { GameComponent } from '../game/game.component';
import { RealtimeService } from '../realtime.service';
import { WatchGameService } from '../watch-game.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private noParallelSession: boolean;
  private beforeUnloadEventListener;
  user: User;
  game: Game;
  Bot: User = Bot;
  showPopoverMenu = false;
  showPanels = true;
  @ViewChild(GameComponent) gameComponent: GameComponent;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private realtime: RealtimeService,
    private watchGame: WatchGameService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.openSession();
    this.subscribeToGameSources();
    this.handleGameRemoval();
  }

  private subscribeToGameSources() {
    this.realtime.games.all.subscribe((games: Game[]) => {
      games.forEach((game: Game) => {
        if (game.ourUserPlays) {
          this.loadGame(game);
        }
      });
    });
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.ourUserPlays) {
        this.loadGame(game);
      }
    });
    this.watchGame.selected.subscribe(this.loadGame.bind(this));
  }

  private handleGameRemoval() {
    this.realtime.games.removed.subscribe(id => {
      if (this.game && this.game.id === id) {
        this.unloadGame();
      }
    });
  }

  private openSession() {
    this.realtime.users.all.subscribe((users: User[]) => {
      this.noParallelSession = !users.map(user => user.id).includes(this.user.id);
      this.realtime.onParallelSessionEvent(this.handleParallelSession.bind(this));
      if (this.noParallelSession) {
        this.realtime.users.add(this.user);
      } else {
        this.realtime.emitParallelSessionEvent();
      }
    });
    this.beforeUnloadEventListener = this.closeSession.bind(this);
    window.addEventListener('beforeunload', this.beforeUnloadEventListener);
  }

  private closeSession() {
    this.realtime.users.remove(this.user.id);
    if (this.game && this.game.ourUserPlays) {
      if (!this.game.isAgainstAi) {
        this.realtime.users.setUserStatus(this.game.opponent.id, 'Online');
      }
      this.realtime.games.remove(this.game.id);
    }
  }

  private handleParallelSession() {
    if (this.noParallelSession) {
      window.removeEventListener('beforeunload', this.beforeUnloadEventListener);
      this.router.navigate(['/login']);
    } else {
      this.noParallelSession = true;
    }
  }

  private loadGame(game: Game) {
    this.game = game;
    this.showPanels = false;
  }

  private unloadGame() {
    this.game = null;
    this.showPanels = true;
  }

  onClickBot() {
    this.realtime.users.setUserStatus(this.user.id, 'Busy');
    const modal = this.modalService.open(GameCreateComponent, { backdrop: 'static' });
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
        this.unloadGame();
        this.realtime.users.setUserStatus(this.user.id, 'Online');
        if (!game.isAgainstAi) {
          this.realtime.users.setUserStatus(game.opponent.id, 'Online');
        }
        this.gameComponent.quitGame();
        this.realtime.games.remove(game.id);
      }
    } else {
      this.unloadGame();
      this.gameComponent.quitGame();
    }
  }

  private quitGameResponse(): Promise<string> {
    return new Promise(resolve => {
      const modal = this.modalService.open(GameQuitComponent);
      modal.result.then((option: string) => resolve(option));
    });
  }

  signout() {
    this.auth.signout();
  }
}
