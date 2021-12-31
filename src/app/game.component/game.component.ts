import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { User, UserStatus } from '../util/models';
import { BoardComponent } from '../board.component/board.component';
import { Game } from '../game/game';
import { WatchGameService } from '../services/watch-game.service';
import { RealtimeService } from '../services/realtime.service';
import { GameOverComponent } from '../game-over.component/game-over.component';
import { NotificationService } from '../services/notification.service';
import { LocalStorageService } from '../services/local-storage.service';
import { Color, Move, State } from '../game/engine';

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
    private notification: NotificationService, private localStorage: LocalStorageService,
    private realtime: RealtimeService, private watchGame: WatchGameService) {
  }

  ngOnInit() {
    this.realtime.games.all.subscribe((games: Game[]) => {
      games.forEach((game: Game) => {
        if (game.isPlayer(this.user)) {
          this.setup(game);
        }
      });
    });
    this.realtime.games.added.subscribe((game: Game) => {
      if (game.isPlayer(this.user)) {
        this.setup(game);
      }
    });
    this.watchGame.selected.subscribe((game: Game) => this.setup(game));
    this.realtime.games.removed.subscribe(id => {
      if (this.game && this.game.id === id && this.game.isPlayer(this.user)) {
        this.game = null;
        this.notification.update(`Game abandoned by player`, 'warning');
      }
    });
  }

  setup(game: Game) {
    if (this.board) {
      this.board.clear();
    }
    this.game = game;
    this.realtime.games.onGameMovesUpdate(game.id, this.onMoveUpdate, this);
    if (game.moves.length > 0) {
      setTimeout(() => this.board.replayGame(), 500);
    }
    this.pushAgentMove();
  }

  players(side: 'left' | 'right'): User {
    switch (side) {
      case 'left':
        if (this.game.isPlayer(this.user)) {
          return this.user;
        } else {
          return this.game.players.red;
        }
      default:
        if (this.game.isPlayer(this.user)) {
          return this.game.opponent(this.user);
        } else {
          return this.game.players.yellow;
        }
    }
  }

  quitGame() {
    this.realtime.games.unsubscribeFromUpdates(this.game.id);
    this.game = null;
  }

  onBoardClick(move: Move) {
    this.realtime.games.updateGameMoves(this.game.id, move);
    this.pushAgentMove();
  }

  onMoveUpdate(move: Move) {
    this.game.update(move);
    this.board.update();
    if (this.game.isGameOver()) {
      this.handleGameEnd();
    }
  }

  private pushAgentMove() {
    if (this.game.isAgentTurn) {
      setTimeout(() => {
        this.realtime.games.updateGameMoves(this.game.id, this.game.getAgentMove());
      }, 500);
    }
  }

  private handleGameEnd() {
    console.log(this.game);
    if (this.game.winner) {
      this.game.winner.points++;
      this.localStorage.setPoints(this.game.winner, this.game.winner.points);
    }
    if (this.game.isPlayer(this.user)) {
      this.handleUserOptionOnGameEnd();
    }
  }

  private async handleUserOptionOnGameEnd() {
    const option = await this.getUserOptionOnGameEnd();
    switch (option) {
      case 'Rematch':
        if (this.game) {
          const initialState = this.game.state === State.RED_WINS ? State.YELLOW_MOVES : State.RED_MOVES;
          const game = this.game;
          this.game = null;
          this.realtime.games.removeGame(game.id);
          this.realtime.games.createGame(game.players.red, game.players.yellow, initialState);
        }
        break;
      case 'Quit':
        if (this.game) {
          this.realtime.users.setUserStatus(this.user.id, UserStatus.Idle);
          if (!this.game.isAgainstAi) {
            const opponent = this.game.opponent(this.user);
            this.realtime.users.setUserStatus(opponent.id, UserStatus.Idle);
          }
          this.realtime.games.removeGame(this.game.id);
          this.game = null;
        }
    }
  }

  private getUserOptionOnGameEnd(): Promise<string> {
    return new Promise(resolve => {
      const modal = this.ngbModal.open(GameOverComponent, { backdrop: 'static' });
      modal.componentInstance.game = this.game;
      modal.componentInstance.user = this.user;
      modal.result.then((option: string) => resolve(option));
    });
  }

  private borderStyle(side: 'left' | 'right') {
    const color = this.game.getPlayerColor(this.players(side)) === Color.RED ? 'red' : 'yellow';
    const css = '5px solid ' + color;
    return css;
  }

}

