import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
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
  isPlayer = false;
  opponent?: User;
  game: Game;
  gameRecord: any;
  recordDestroyed = false;
  callback: any;
  localState = { onHold: false };

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
      this.unloadGame();
      const gameId = params.get('gameId');
      if (deepstream.record.getList('games').getEntries().includes(gameId)) {
        this.gameRecord = deepstream.record.getRecord(gameId);
        const interval = setInterval(() => {
          const data = this.gameRecord.get();
          if (data.id) {
            this.loadGame(data);
            this.gameRecord.subscribe('moves', this.onGameMovesUpdate.bind(this));
            this.gameRecord.subscribe('state', this.onGameStateUpdate.bind(this));
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
    this.game = new Game(data);
    this.setRelationship();
    setTimeout(() => {
      this.board.clear();
      this.board.replayGame(this.game.moves, this.game.redMovesFirst);
    }, 0);
    console.log('Game loaded: ', this.game);
  }

  setRelationship() {
    const array = [this.game.players.red, this.game.players.yellow];
    if (array.map((u: User) => u.id).includes(this.user.id)) {
      this.isPlayer = true;
      this.opponent = array.find((u: User) => u.id !== this.user.id);
    }
  }

  unloadGame() {
    if (this.game) {
      console.log('Unloading game: ', this.game);
      this.board.clear();
      this.game = null;
      this.gameRecord.unsubscribe(this.callback);
    }
  }

  onMove(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  onGameMovesUpdate(moves: string[] = []) {
    if (moves.length > 0) {
      const idLastMove = moves.pop();
      this.board.replayMove(idLastMove);
      moves.push(idLastMove);
      this.game.update(moves);
      if (this.game.gameOver) {
        if (this.game.winner.id === this.user.id) {
          this.gameRecord.set('state', 'over');
          this.gameRecord.set('points', this.game.points);
          this.gameRecord.set('winner', this.user);
        }
      }
    }
  }

  onGamePointsUpdate(points: any) {
    this.game.points = points;
  }

  onGameStateUpdate(state: 'in progress' | 'over' | 'on hold') {
    if (state === 'on hold') {
      if (!this.isPlayer) {
        return; // we are watcher
      }
    }
    if (state === 'over') {
      if (this.game.state === 'in progress') {
        return; // opposite side won
      }
    }
    if (state === 'in progress') {
      if (this.game.state === 'on hold') {
        this.game.reset();
        this.localState.onHold = false;
      }
    }
    this.game.state = state;
  }


  onClickNewGame() {
    let nextState;
    if (this.game.state === 'over') {
      nextState = 'on hold';
      this.localState.onHold = true;
    } else if (this.game.state === 'on hold') {
      nextState = 'in progress';
      this.gameRecord.set('moves', []);
      this.gameRecord.set('redMovesFirst', this.game.redMovesFirst);
    }
    this.gameRecord.set('state', nextState);
    this.board.clear();

  }

  /** Turn on/off button visibility */
  get newGameButtonStyle(): { [key: string]: string } {
    return this.isPlayer &&
      (this.game.state === 'over' || this.game.state === 'on hold') && !this.localState.onHold ?
      { visibility: 'visible' } : { visibility: 'hidden' };
  }

  get gameOnHoldMessage() {
    const showMessage = this.isPlayer && this.localState.onHold;
    return showMessage ? `Waiting for ${this.opponent.name}...` : null;
  }

  get isOurTurn() {
    return this.isPlayer && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage() {
    if (this.isPlayer) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${this.game.activePlayer.name}...`;
    } else {
      return `Waiting for ${this.game.activePlayer.name}...`;
    }
  }

  get gameOverMessage() {
    if (this.game.state === 'in progress' || this.localState.onHold) {
      return null;
    }
    if (this.isPlayer) {
      return this.game.winner.id === this.user.id ? 'You win!' : 'You lose...';
    } else {
      const winner = this.game.winner;
      return `${winner.name}} wins!}`;
    }
  }

  userOffline(userId: string) {
    if (this.game) {
      const offlinePlayer = [this.game.players.red, this.game.players.yellow].find(u => u.id === userId);
      if (offlinePlayer) {
        this.recordDestroyed = true;
        this.gameRecord.set('state', `waiting for ${offlinePlayer.name}`);
        if (this.isPlayer && this.user.id !== offlinePlayer.id) {
          this.notification.update(`${offlinePlayer.name} went offline`, 'danger');
        }
      }
    }
  }

}
