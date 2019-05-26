import { Component, OnInit, ViewChild, Input } from '@angular/core';

import { DeepstreamService } from '../deepstream.service';
import { User } from '../util/user';
import { BoardComponent } from './board/board.component';
import { Game } from './game';
import { NewGameService } from '../new-game.service';

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
  client: deepstreamIO.Client;
  newGameBtnClicked = false;

  constructor(private deepstream: DeepstreamService, private newGame: NewGameService) { }

  ngOnInit() {
    this.client = this.deepstream.getInstance();
  }

  loadGame(data: any) {
    this.game = new Game(data);
    this.record = this.client.record.getRecord(data.id);
    this.record.subscribe('state', this.onStateUpdate.bind(this));
    const players = [data.players.red, data.players.yellow];
    if (players.map((user: User) => user.id).includes(this.user.id)) {
      this.isPlayer = true;
      this.opponent = players.find((user: User) => user.id !== this.user.id);
    }
    this.client.event.subscribe(`moves/${this.game.id}`, this.onMoveUpdate.bind(this));
    setTimeout(() => {
      this.board.clear();
      this.board.replayGame(data.moves, data.redMovesFirst || true);
    }, 0);
  }

  unloadGame() {
    if (this.record) {
      this.record.unsubscribe('state', undefined);
      this.client.event.unsubscribe(`moves/${this.game.id}`, undefined);
      this.record = null;
    }
    this.game = null;
  }

  onBoardClick(id: string) {
    if (this.record) {
      this.client.event.emit(`moves/${this.game.id}`, id);
    }
  }

  onMoveUpdate(id: string) {
    this.board.move(id);
    this.game.update(id);
    if (this.user.id === this.game.players.red.id || this.isPlayer && this.game.isAgainstAi) {
      this.record.set('moves', this.game.moves);
      if (this.game.state === 'over') {
        this.record.set('state', 'over');
        this.record.set('points', this.game.points);
        this.record.set('winner', this.game.winner);
      }
    }
    if (this.game.state === 'in progress' && this.isPlayer && this.game.isAgainstAi && !this.isMyTurn) {
      setTimeout(() => {
        this.client.event.emit(`moves/${this.game.id}`, this.game.nextBestMove());
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
        if (this.isPlayer && this.game.isAgainstAi && !this.isMyTurn) {
          setTimeout(() => {
            this.client.event.emit(`moves/${this.game.id}`, this.game.nextBestMove());
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
      this.newGame.sendRematchInvitation(this.opponent.id, this.game.id);
    }
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
    if (this.game.state === 'over') {
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

