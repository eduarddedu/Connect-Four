import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DeepstreamService } from '../deepstream.service';
import { AuthService, User } from '../auth.service';
import { NotificationService } from '../notification.service';
import { Invitation } from '../panels/panel-players/panel-players.component';
import { BoardComponent } from './board/board.component';
import { Game } from './game';
import { GameService } from '../game.service';

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
  deepstream: any;
  recordDestroyed = false;
  callback: any;
  newGameClicked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private notification: NotificationService,
    private ds: DeepstreamService,
    private gameService: GameService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.deepstream = this.ds.getInstance();
    this.route.paramMap.subscribe(params => {
      const gameId = params.get('gameId');
      if (this.deepstream.record.getList('games').getEntries().includes(gameId)) {
        this.gameRecord = this.deepstream.record.getRecord(gameId);
        const interval = setInterval(() => {
          const data = this.gameRecord.get();
          if (data.id) {
            this.loadGame(data);
            this.gameRecord.subscribe('moves', this.onGameMovesUpdate.bind(this));
            this.gameRecord.subscribe('state', this.onGameStateUpdate.bind(this));
            this.gameRecord.subscribe('redMovesFirst', this.onRedMovesFirstUpdate.bind(this));
            clearInterval(interval);
          }
        }, 50);
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
    if (this.isPlayer) {
      this.gameService.push(this.game);
    }
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
      if (this.game.isOver) {
        if (this.game.winner.id === this.user.id) {
          this.gameRecord.set('state', 'over');
          this.gameRecord.set('points', this.game.points);
          this.gameRecord.set('winner', this.user);
        }
      }
    }
  }

  onGameStateUpdate(state: 'in progress' | 'over') {
    const rematch = this.game.state === 'over' && state === 'in progress';
    if (rematch) {
      this.newGameClicked = false;
      this.board.clear();
      this.game.newGame();
      if (this.game.winner.id === this.user.id) {
        this.gameRecord.set('moves', []);
        this.gameRecord.set('redMovesFirst', this.game.redMovesFirst);
      }
    }
    this.game.state = state;
  }

  onRedMovesFirstUpdate(redMovesFirst: boolean) {
    this.game.redMovesFirst = redMovesFirst;
  }


  onClickNewGame() {
    this.newGameClicked = true;
    this.deepstream.event.emit(`invitations/${this.opponent.id}`, <Invitation>{
      from: { userId: this.user.id }, topic: 'Rematch', details: { gameId: this.game.id }
    });
  }

  get newGameButtonStyle(): { [key: string]: string } {
    return this.isPlayer && this.game.isOver ?
      { visibility: 'visible' } : { visibility: 'hidden' };
  }

  get isOurTurn() {
    return this.isPlayer && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage() {
    if (this.isPlayer) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${this.game.activePlayer.name}...`;
    }
    return `Waiting for ${this.game.activePlayer.name}...`;
  }

  get gameOverMessage() {
    if (this.game.isOver) {
      if (this.isPlayer) {
        if (this.newGameClicked) {
          return `Invitation sent. Waiting for ${this.opponent.name}`;
        }
          return this.game.winner.id === this.user.id ? 'You win 😀' : 'You lose 😞';
        }
        return `${this.game.winner.name} wins!`;
      }
    }

  }
