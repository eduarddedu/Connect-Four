import { Component, OnInit, ViewChild, Input, ChangeDetectorRef } from '@angular/core';

import { User, Bot } from '../util/models';
import { BoardComponent } from './board/board.component';
import { Game } from './game';
import { WatchGameService } from '../watch-game.service';
import { RealtimeService } from '../realtime.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  @ViewChild(BoardComponent) board: BoardComponent;
  @Input() user: User;
  game: Game;
  newGameBtnClicked = false;

  constructor(private realtime: RealtimeService, private watchGame: WatchGameService, private cdr: ChangeDetectorRef) {

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
        this.cdr.detectChanges();
      }
    });
    this.watchGame.selected.subscribe((game: Game) => this.setup(game));
  }

  setup(game: Game) {
    this.game = game;
    this.realtime.games.onGameStateUpdate(game.id, this.onStateUpdate.bind(this));
    this.realtime.games.onGameMovesUpdate(game.id, this.onMoveUpdate.bind(this));
    if (this.game.moves.length > 0) {
      setTimeout(() => this.board.replayGame(this.game));
    }
  }

  quitGame() {
    this.realtime.games.unsubscribeFromStateAndMovesUpdates(this.game.id);
    this.game = null;
  }

  onBoardClick(id: string) {
    this.realtime.games.updateGameMoves(this.game.id, id);
  }

  onMoveUpdate(id: string) {
    this.board.move(id);
    this.game.update(id);
    if (this.user.id === this.game.players.red.id || this.game.ourUserPlays && this.game.isAgainstAi) {
      if (this.game.state === 'over') {
        const data = {
          state: 'over',
          points: this.game.points,
          winner: this.game.winner
        };
        this.realtime.games.updateGameData(this.game.id, data);
      }
    }
    if (this.game.state === 'in progress' && this.game.ourUserPlays && this.game.isAgainstAi && !this.isOurTurn) {
      setTimeout(() => {
        this.realtime.games.updateGameMoves(this.game.id, this.game.nextBestMove());
      }, 500);
    }
    this.cdr.detectChanges();
  }

  onStateUpdate(state: 'in progress' | 'over') {
    if (this.game.state === 'over' && state === 'in progress') {
      this.board.clear();
      this.game.reset();
      this.newGameBtnClicked = false;
      if (this.user.id === this.game.players.red.id || this.game.ourUserPlays && this.game.isAgainstAi) {
        this.realtime.games.updateGameData(this.game.id, {
          moves: [],
          redMovesFirst: this.game.redMovesFirst
        });
      }
      if (this.game.ourUserPlays && this.game.isAgainstAi && this.game.activePlayer === Bot) {
        setTimeout(() => {
          this.realtime.games.updateGameMoves(this.game.id, this.game.nextBestMove());
        }, 500);
      }
    }
    this.cdr.detectChanges();
  }

  onClickNewGame() {
    if (this.game.ourUserPlays && this.game.isAgainstAi) {
      this.realtime.games.updateGameState(this.game.id, 'in progress');
    } else {
      this.newGameBtnClicked = true;
      this.realtime.messages.sendRematchMessage(this.game.opponent.id);
    }
  }

  get isOurTurn(): boolean {
    return this.game.ourUserPlays && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage(): string | undefined {
    const username = this.game.activePlayer.name.replace(/ .*/, '');
    if (this.game.ourUserPlays) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${username}...`;
    }
    return `Waiting for ${username}...`;
  }

  get gameOverMessage(): string | undefined {
    if (this.game.state === 'over') {
      if (this.game.ourUserPlays) {
        return this.newGameBtnClicked ? `Invitation sent. Waiting for ${this.game.opponent.name}` :
          this.game.winner ?
            this.game.winner.id === this.user.id ? 'You win 😀' : 'You lose 😞' : `It's a draw 🤔`;
      }
      return this.game.winner ? `${this.game.winner.name} wins!` : `It's a draw 🤔`;
    }
  }

  get showNewGameButton(): boolean {
    return this.game && this.game.ourUserPlays && this.game.state === 'over';
  }

}

/**
 * GameComponent's task is to update the game state and user interface throughout the game loop cycle.
 */

