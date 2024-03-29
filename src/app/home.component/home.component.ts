/**
 * HomeComponent initiates and closes the realtime session of the user and handles navigation.
 * Navigation occurs when the user clicks on the logo button while the view displays a game in progress.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';


import { AuthService } from '../services/auth.service';
import { User, Bot, UserStatus } from '../util/models';
import { GameCreateComponent } from '../game-create.component/game-create.component';
import { GameQuitComponent } from '../game-quit.component/game-quit.component';
import { Game } from '../game/game';
import { GameComponent } from '../game.component/game.component';
import { RealtimeService } from '../services/realtime.service';
import { WatchGameService } from '../services/watch-game.service';
import { LocalStorageService } from '../services/local-storage.service';
import { Color, State } from '../game/engine';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private only_self_online: boolean;
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
    private watchGame: WatchGameService,
    private localStorage: LocalStorageService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.openSession();
    this.subscribeToGameSources();
    this.handleGameRemoval();
    this.Bot.points = this.localStorage.getPoints(Bot);
  }

  private subscribeToGameSources() {
    this.realtime.games.all.subscribe((games: Game[]) => {
      games.forEach((game: Game) => {
        if (game.isPlayer(this.user)) {
          this.loadGame(game);
        }
      });
    });
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.isPlayer(this.user)) {
        this.loadGame(game);
      }
    });
    this.watchGame.selected.subscribe(this.loadGame.bind(this));
  }

  private handleGameRemoval() {
    this.realtime.games.removed.subscribe(id => {
      if (this.game && this.game.id === id && this.game.isPlayer(this.user)) {
        this.unloadGame();
      }
    });
  }

  private openSession() {
    this.realtime.users.all.subscribe((users: User[]) => {
      users.forEach((user: User) => {
        if (user.id === this.user.id) {
          this.only_self_online = false;
          this.user.status = user.status;
        }
      });
      this.realtime.onParallelLoginEvent(this.onParallelLogin.bind(this));
      this.realtime.users.addUser();
      if (!this.only_self_online) {
        this.realtime.emitParallelLoginEvent();
      }
    });
    window.addEventListener('beforeunload', this.closeRealtimeSession.bind(this));
  }

  private closeRealtimeSession() {
    this.realtime.users.removeUser();
    if (this.game && this.game.isPlayer(this.user) && this.only_self_online) {
      if (!this.game.isAgainstAi) {
        this.realtime.users.setUserStatus(this.game.opponent(this.user).id, UserStatus.Idle);
      }
      this.realtime.games.removeGame(this.game.id);
    }
  }

  private onParallelLogin() {
    if (this.only_self_online) {
      this.only_self_online = false;
      this.closeRealtimeSession();
      this.router.navigate(['/login']);
    } else {
      this.only_self_online = true;
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
    this.realtime.users.setUserStatus(this.user.id, UserStatus.Playing);
    const modal = this.modalService.open(GameCreateComponent, { backdrop: 'static' });
    modal.componentInstance.user = this.user;
    modal.componentInstance.opponent = Bot;
    modal.componentInstance.userPlaysRed = true;
    modal.componentInstance.items = [
      { key: 'Red moves first', selected: true, value: Color.RED },
      { key: 'Yellow moves first', selected: false, value: Color.YELLOW }];
    modal.result.then((options: any) => {
      if (typeof options === 'object') {
        const initialState = options.redMovesFirst ? State.RED_MOVES : State.YELLOW_MOVES;
        const redPlayer = options.userPlaysRed ? this.user : Bot;
        const yellowPlayer = options.userPlaysRed ? Bot : this.user;
        this.realtime.games.createGame(redPlayer, yellowPlayer, initialState);
      } else if (options === 'Cancel') {
        this.realtime.users.setUserStatus(this.user.id, UserStatus.Idle);
      }
    });
  }

  onClickLogo() {
    if (this.game) {
      this.closeGameView();
    }
  }

  private async closeGameView() {
    if (this.game.isPlayer(this.user)) {
      const option = await this.quitGameResponse();
      if (option === 'Quit') {
        const game = this.game;
        this.unloadGame();
        this.realtime.users.setUserStatus(this.user.id, UserStatus.Idle);
        if (!game.isAgainstAi) {
          this.realtime.users.setUserStatus(game.opponent(this.user).id, UserStatus.Idle);
        }
        this.gameComponent.quitGame();
        this.realtime.games.removeGame(game.id);
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
}
