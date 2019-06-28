/**
 * GameComponent updates the Game object and the GUI throughout the game loop.
 */

import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User, Bot } from '../util/models';
import { BoardComponent } from './board/board.component';
import { Game } from './game';
import { WatchGameService } from '../watch-game.service';
import { RealtimeService } from '../realtime.service';
import { GameOverComponent } from '../modals/game-over/game-over.component';
import { NotificationService } from '../notification.service';
import { LocalStorageService } from '../local-storage.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  @ViewChild(BoardComponent) board: BoardComponent;
  @Input() user: User;
  game: Game;

  constructor(private ngbModal: NgbModal,
    private notification: NotificationService, private localStorageService: LocalStorageService,
    private realtime: RealtimeService, private watchGame: WatchGameService) {
  }

  ngOnInit() {
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.ourUserPlays) {
        this.setup(game);
      }
    });
    this.realtime.games.removed.subscribe(id => {
      if (this.game && this.game.id === id) {
        this.game = null;
        this.notification.update(`Game abandoned by player`, 'warning');
      }
    });
    this.watchGame.selected.subscribe((game: Game) => this.setup(game));
    window.addEventListener('beforeunload', this.destroyGameOnWindowClose.bind(this));
  }

  setup(game: Game) {
    this.game = game;
    this.realtime.games.onGameStateUpdate(game.id, this.onStateUpdate, this);
    this.realtime.games.onGameMovesUpdate(game.id, this.onMoveUpdate, this);
    if (this.game.moves.length > 0) {
      setTimeout(() => this.board.replayGame(this.game));
    }
  }

  quitGame() {
    this.realtime.games.unsubscribeFromUpdates(this.game.id);
    this.game = null;
  }

  onBoardClick(id: string) {
    this.realtime.games.updateGameMoves(this.game.id, id);
  }

  onMoveUpdate(id: string) {
    this.board.move(id);
    this.game.updateMoves(id);
    switch (this.game.state) {
      case 'over':
        this.handleGameOver();
        break;
      case 'in progress':
        this.handleBotMove();
    }
  }

  onStateUpdate(state: 'in progress' | 'over' | 'on hold') {
    switch (state) {
      case 'in progress':
        this.board.clear();
        this.resetGame();
        this.handleBotMove();
        break;
      case 'over':
        break;
      case 'on hold':
        this.game.state = 'on hold';
        this.game.updateStatus();
    }
  }

  private handleBotMove() {
    if (this.game.ourUserPlays && this.game.isAgainstAi && this.game.activePlayer.id === Bot.id) {
      setTimeout(() => {
        this.realtime.games.updateGameMoves(this.game.id, this.game.nextBestMove());
      }, 600);
    }
  }

  private async handleGameOver() {
    if (this.user.id === this.game.players.red.id || this.game.ourUserPlays && this.game.isAgainstAi) {
      this.realtime.games.updateGameProperties(this.game.id, {
        state: 'over',
        points: this.game.points,
        winner: this.game.winner
      });
    }
    if (this.game.winner.id === this.user.id) {
      this.user.points += 1;
      this.localStorageService.setPoints(this.user.points);
    }
    if (this.game.ourUserPlays) {
      this.handleUserOptionOnGameEnd();
    }
  }

  private async handleUserOptionOnGameEnd() {
    const option = await this.getUserOptionOnGameEnd();
    switch (option) {
      case 'Rematch':
        if (this.game) {
          if (this.game.isAgainstAi) {
            this.realtime.games.updateGameState(this.game.id, 'in progress');
          } else {
            if (this.game.state === 'on hold') {
              this.realtime.games.updateGameState(this.game.id, 'in progress');
            } else {
              this.realtime.games.updateGameState(this.game.id, 'on hold');
            }
          }
        }
        break;
      case 'Quit':
        if (this.game) {
          this.realtime.users.setUserStatus(this.user.id, 'Online');
          if (!this.game.isAgainstAi) {
            this.realtime.users.setUserStatus(this.game.opponent.id, 'Online');
          }
          const gameId = this.game.id;
          this.game = null;
          this.realtime.games.remove(gameId);
        }
    }
  }

  private getUserOptionOnGameEnd(): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        const modal = this.ngbModal.open(GameOverComponent, { backdrop: 'static' });
        modal.componentInstance.game = new Game(this.game, this.user);
        modal.componentInstance.user = this.user;
        modal.result.then((option: string) => resolve(option));
      }, 1000);
    });
  }

  private resetGame() {
    const data = Object.assign(this.game, {
      moves: [],
      state: 'in progress',
      redMovesFirst: this.game.winner.id === this.game.players.yellow.id,
      winner: null
    });
    this.game = new Game(data, this.user);
    if (this.user.id === this.game.players.red.id || this.game.ourUserPlays && this.game.isAgainstAi) {
      this.realtime.games.updateGameProperties(this.game.id, {
        moves: [],
        redMovesFirst: this.game.redMovesFirst
      });
    }
  }

  private destroyGameOnWindowClose() {
    if (this.game && this.game.ourUserPlays) {
      if (!this.game.isAgainstAi) {
        this.realtime.users.setUserStatus(this.game.opponent.id, 'Online');
      }
      this.realtime.games.remove(this.game.id);
    }
  }

}

