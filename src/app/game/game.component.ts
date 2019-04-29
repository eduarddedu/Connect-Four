/**
 * GameComponent updates the game record and manages the data flow between all parties and application components.
 */

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { DeepstreamService } from '../deepstream.service';
import { AuthService, User } from '../auth.service';
import { Invitation } from '../panels/panel-players/panel-players.component';
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
  record: deepstreamIO.Record;
  ds: deepstreamIO.Client;
  newGameBtnClicked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private deepstreamService: DeepstreamService) {
  }

  ngOnInit() {
    this.user = this.auth.user;
    this.ds = this.deepstreamService.getInstance();
    this.route.paramMap.pipe(map(params => params.get('gameId')))
      .subscribe(gameId => {
        this.ds.record.has(gameId, (error, hasRecord) => {
          if (hasRecord) {
            this.record = this.ds.record.getRecord(gameId);
            const interval = setInterval(() => {
              const data = this.record.get();
              if (data.id) {
                this.loadGame(data);
                clearInterval(interval);
              }
            }, 50);
          } else {
            this.router.navigate(['/']);
          }
        });
      });
  }

  ngOnDestroy() {
    if (this.record) {
      this.record.unsubscribe('state', undefined);
      this.ds.event.unsubscribe(`${this.game.id}/moves`, undefined);
    }
  }

  loadGame(data: any) {
    this.game = new Game(data);
    this.ds.event.subscribe(`${this.game.id}/moves`, this.onMoveUpdate.bind(this));
    this.record.subscribe('state', this.onStateUpdate.bind(this));
    this.ds.record.getList('games').on('entry-removed', id => {
      if (this.game && this.game.id === id) {
        this.record = null;
      }
    });
    this.setRelationship();
    setTimeout(() => {
      this.board.clear();
      this.board.replayGame(data.moves, data.redMovesFirst || true);
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

  onBoardClick(id: string) {
    if (this.record) {
      this.ds.event.emit(`${this.game.id}/moves`, id);
    }
  }

  onMoveUpdate(id: string) {
    this.board.move(id);
    this.game.move(+id);
    if (this.user.id === this.game.players.red.id || this.isPlayer && this.game.isAgainstAi) {
      this.record.set('moves', this.game.moves);
      if (this.game.gameover) {
        this.record.set('state', 'over');
        this.record.set('points', this.game.points);
        this.record.set('winner', this.game.winner);
      }
    }
    if (this.game.state === 'in progress' && this.isPlayer && this.game.activePlayer.id === '0') {
      setTimeout(() => {
        this.ds.event.emit(`${this.game.id}/moves`, this.game.nextBestMove());
      }, 500);
    }
  }

  onStateUpdate(state: 'in progress' | 'over') {
    if (this.game.state === 'over' && state === 'in progress') {
      this.board.clear();
      this.game.reset();
      this.newGameBtnClicked = false;
      if (this.user.id === this.game.players.red.id || this.isPlayer && this.game.isAgainstAi) {
        this.record.set('moves', []);
        this.record.set('redMovesFirst', this.game.redMovesFirst);
      }
    }
    this.game.state = state;
  }

  onClickNewGame() {
    if (this.isPlayer && this.game.isAgainstAi) {
      this.record.set('state', 'in progress');
    } else {
      this.newGameBtnClicked = true;
      this.ds.event.emit(`invitations/${this.opponent.id}`, <Invitation>{
        from: { userId: this.user.id }, topic: 'Rematch', details: { gameId: this.game.id }
      });
    }
  }

  get newGameButtonStyle(): { [key: string]: string } {
    return this.isPlayer && this.game.gameover && this.record ?
      { visibility: 'visible' } : { visibility: 'hidden' };
  }

  get isMyTurn() {
    return this.isPlayer && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage() {
    const username = this.game.activePlayer.name.replace(/ .*/, '');
    if (this.isPlayer) {
      return this.isMyTurn ? 'Your turn' : `Waiting for ${username}...`;
    }
    return `Waiting for ${username}...`;
  }

  get gameOverMessage() {
    if (this.game.gameover) {
      if (this.isPlayer) {
        return this.newGameBtnClicked ? `Invitation sent. Waiting for ${this.opponent.name}` :
          this.game.winner ?
            this.game.winner.id === this.user.id ? 'You win 😀 🏆' : 'You lose 😞' : `It's a draw 🤔`;
      }
      return this.game.winner ? `${this.game.winner.name} wins!` : `It's a draw 🤔`;
    }
  }

}
