import { Component, OnInit, ViewChild, Input } from '@angular/core';

import { DeepstreamService } from '../deepstream.service';
import { User } from '../auth.service';
import { Invitation } from '../panels/panel-players/panel-players.component';
import { BoardComponent } from './board/board.component';
import { Game } from './game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  @ViewChild(BoardComponent) board: BoardComponent;
  @Input() user: User;
  isPlayer = false;
  opponent?: User;
  game: Game;
  record: deepstreamIO.Record;
  ds: deepstreamIO.Client;
  newGameBtnClicked = false;

  constructor(private deepstreamService: DeepstreamService) { }

  ngOnInit() {
    this.ds = this.deepstreamService.getInstance();
  }

  async loadGame(gameId: string) {
    this.record = this.ds.record.getRecord(gameId);
    const data = await this.pollRecord(this.record, 50);
    this.game = new Game(data);
    this.ds.event.subscribe(`${this.game.id}/moves`, this.onMoveUpdate.bind(this));
    this.record.subscribe('state', this.onStateUpdate.bind(this));
    const players = [data.players.red, data.players.yellow];
    if (players.map((user: User) => user.id).includes(this.user.id)) {
      this.isPlayer = true;
      this.opponent = players.find((user: User) => user.id !== this.user.id);
    }
    setTimeout(() => {
      this.board.clear();
      this.board.replayGame(data.moves, data.redMovesFirst || true);
    }, 0);
  }

  private pollRecord(record: deepstreamIO.Record, millis: number): Promise<any> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        const data = record.get();
        if (Object.keys(data).length > 0) {
          clearInterval(interval);
          resolve(data);
        }
      }, millis);
    });
  }

  unloadGame() {
    if (this.record) {
      this.record.unsubscribe('state', undefined);
      this.ds.event.unsubscribe(`${this.game.id}/moves`, undefined);
      this.record = null;
    }
    this.game = null;
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
        if (this.isPlayer && this.game.activePlayer.id === '0') {
          setTimeout(() => {
            this.ds.event.emit(`${this.game.id}/moves`, this.game.nextBestMove());
          }, 500);
        }
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
            this.game.winner.id === this.user.id ? 'You win 😀' : 'You lose 😞' : `It's a draw 🤔`;
      }
      return this.game.winner ? `${this.game.winner.name} wins!` : `It's a draw 🤔`;
    }
  }

}

/**
 * GameComponent's task is to update the game state and user interface throughout the game loop cycle.
 */

