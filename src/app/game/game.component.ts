import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { DeepstreamService } from '../deepstream.service';
import { AuthService, User } from '../auth.service';
import { Invitation } from '../panels/panel-players/panel-players.component';
import { BoardComponent } from './board/board.component';
import { Game } from './game';
import { AI } from './ai';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild(BoardComponent) board: BoardComponent;
  user: User;
  isPlayer = false;
  isPlayingAgainstAI = false;
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
      ['moves', 'state', 'redMovesFirst'].forEach(path => this.record.unsubscribe(path, null));
    }
  }

  loadGame(data: any) {
    this.game = new Game(data);
    this.record.subscribe('moves', this.onGameMovesUpdate.bind(this));
    this.record.subscribe('state', this.onGameStateUpdate.bind(this));
    this.record.subscribe('redMovesFirst', this.onRedMovesFirstUpdate.bind(this));
    this.ds.record.getList('games').on('entry-removed', id => {
      if (this.game.id === id) {
        this.record = null;
      }
    });
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
      this.isPlayingAgainstAI = this.opponent.id === '0';
    }
  }

  onMove(id: string) {
    if (this.record) {
      const moves = this.record.get('moves');
      moves.push(id);
      this.record.set('moves', moves);
    }
  }

  onGameMovesUpdate(moves: string[] = []) {
    if (moves.length > 0) {
      const id = moves.pop();
      this.board.move(id);
      this.game.move(id);
      if (this.game.gameover) {
        if (this.game.winner.id === this.user.id || this.isPlayingAgainstAI) {
          this.record.set('state', 'over');
          this.record.set('points', this.game.points);
          this.record.set('winner', this.game.winner);
        }
      } else if (this.isPlayingAgainstAI && !this.isOurTurn) {
        // setTimeout(() => this.onMove(AI.randomMove(true, moves)), 500);
        // setTimeout(() => this.onMove(AI.bestMove(true, moves)), 500);
        console.log(AI.bestMove(true, moves));
      }
    }
  }

  onGameStateUpdate(state: 'in progress' | 'over') {
    if (this.game.state === 'over' && state === 'in progress') {
      this.newGameBtnClicked = false;
      this.board.clear();
      this.game.reset();
      if (this.game.winner.id === this.user.id || this.isPlayingAgainstAI) {
        this.record.set('moves', []);
        this.record.set('redMovesFirst', this.game.redMovesFirst);
      }
    }
    this.game.state = state;
  }

  onRedMovesFirstUpdate(redMovesFirst: boolean) {
    this.game.redMovesFirst = redMovesFirst;
  }

  onClickNewGame() {
    if (this.isPlayingAgainstAI) {
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

  get isOurTurn() {
    return this.isPlayer && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage() {
    const username = this.game.activePlayer.name.replace(/ .*/, '');
    if (this.isPlayer) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${username}...`;
    }
    return `Waiting for ${username}...`;
  }

  get gameOverMessage() {
    if (this.game.gameover) {
      if (this.isPlayer) {
        if (this.newGameBtnClicked) {
          return `Invitation sent. Waiting for ${this.opponent.name}`;
        }
        return this.game.winner.id === this.user.id ? 'You win 😀' : 'You lose 😞';
      }
      return `${this.game.winner.name} wins!`;
    }
  }

}
