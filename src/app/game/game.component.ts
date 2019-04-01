import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DeepstreamService } from '../deepstream.service';
import { AuthService, User } from '../auth.service';
import { NotificationService } from '../notification.service';
import { BoardComponent } from './board/board.component';
import { Game } from './game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild(BoardComponent) board: BoardComponent;
  user: User;
  game: Game;
  gameRecord: any;
  recordDestroyed = false;
  callback: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private notification: NotificationService,
    private ds: DeepstreamService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    const deepstream = this.ds.getInstance();
    this.route.paramMap.subscribe(params => {
      if (this.game) {
        this.unloadGame();
      }
      const gameId = params.get('gameId');
      if (deepstream.record.getList('games').getEntries().includes(gameId)) {
        this.gameRecord = deepstream.record.getRecord(gameId);
        const interval = setInterval(() => {
          const data = this.gameRecord.get();
          if (data.id) {
            this.loadGame(data);
            this.gameRecord.subscribe('moves', this.onGameMovesUpdate.bind(this));
            this.gameRecord.subscribe('state', this.onGameStateUpdate.bind(this));
            this.gameRecord.subscribe('points', this.onGamePointsUpdate.bind(this));
            clearInterval(interval);
          }
        }, 50);
        deepstream.record.getList('users').on('entry-removed', this.userOffline.bind(this));
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }

  ngOnDestroy() {
    if (this.game && !this.recordDestroyed) {
      this.gameRecord.unsubscribe(this.callback);
    }
  }

  loadGame(data: any) {
    this.game = new Game(data, this.user);
    console.log('Game: ', this.game);
    setTimeout(() => {
      this.board.clearBoard();
      this.board.replayGame(this.game.moves, this.game.redMovesFirst);
    }, 0);
  }

  unloadGame() {
    this.board.clearBoard();
    this.game = null;
    this.gameRecord.unsubscribe(this.callback);
  }

  onMove(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
    /* if (moves.length === 1) {
      this.gameRecord.set('reset', false);
    } */
  }

  onGameMovesUpdate(moves: string[] = []) {
    this.game.moves = moves;
    if (moves.length > 0) {
      const id = moves.pop();
      const indexNextMove = moves.length + 1;
      this.board.replayMove(id);
      if (this.game.gameOver()) {
        // figure out the winner, update local data and if we are the winner, update the record
        /* this.gameRecord.set('winner', this.game.activePlayer);
        this.gameRecord.set('state', 'completed');
        const key = this.game.activePlayer === this.game.players.red ? 'red' : 'yellow';
        this.game.points[`${key}`] += 1;
        this.gameRecord.set('points', this.game.points); */
      } else {
        this.game.toggleActivePlayer(indexNextMove);
      }
    }
  }

  onGameStateUpdate(state: 'in progress' | 'over' | 'reset') {
    this.game.state = state;
  }

  onGamePointsUpdate(points: any) {
    this.game.points = points;
  }


  onClickNewGame() {
    if (this.game.state === `waiting for ${this.user.name}`) {
      this.gameRecord.set('state', 'in progress');
      this.gameRecord.set('moves', []);
      this.gameRecord.set('reset', true);
    } else {
      this.gameRecord.set('state', `waiting for ${this.game.opponent.name}`);
    }
  }

  resetGame() {
    this.board.clearBoard();
    this.game.redMovesFirst = this.game.winner.name === this.game.players.red.name ? false : true;
    this.game.toggleActivePlayer(0);
  }

  get showWaitingFor() {
    return this.game.opponent && this.game.state === `waiting for ${this.game.opponent.name}`;
  }

  get newGameButtonVisibility(): 'visible' | 'hidden' {
    return this.game.player && (this.game.state === 'over' || this.game.state === `waiting for ${this.game.player.name}`) ?
      'visible' : 'hidden';
  }

  get isOurTurn() {
    return this.game.activePlayer === this.game.player && this.game.state === 'in progress';
  }

  get turnMessage() {
    if (this.game.player) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${this.game.activePlayer.name}...`;
    } else {
      return `Waiting for ${this.game.activePlayer.name}...`;
    }
  }

  get gameOver() {
    return this.game.state === 'over' ||
      (!this.game.player && this.game.state.startsWith('waiting for') ||
        this.game.player && this.game.state === `waiting for ${this.game.player.name}`);
  }

  get gameOverMessage() {
    if (this.game.player) {
      return this.game.winner.name === this.game.player.name ? 'You win!' : 'You lose...';
    } else {
      return `${this.game.winner.name}} wins!}`;
    }
  }

  userOffline(userId: string) {
    if (this.game) {
      const offlinePlayer = [this.game.players.red, this.game.players.yellow].find(u => u.id === userId);
      if (offlinePlayer) {
        this.recordDestroyed = true;
        this.gameRecord.set('state', `waiting for ${offlinePlayer.name}`);
        if (this.game.player && this.game.player.id !== offlinePlayer.id) {
          this.notification.update(`${offlinePlayer.name} went offline`, 'danger');
        }
      }
    }
  }

}
