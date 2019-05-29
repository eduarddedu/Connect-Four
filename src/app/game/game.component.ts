import { Component, OnInit, ViewChild, Input, ChangeDetectorRef } from '@angular/core';

import { DeepstreamService } from '../deepstream.service';
import { User, Bot } from '../util/user';
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
  game: Game;
  record: deepstreamIO.Record;
  client: deepstreamIO.Client;
  newGameBtnClicked = false;

  constructor(private deepstream: DeepstreamService, private newGame: NewGameService, private cdr: ChangeDetectorRef) {
    this.client = this.deepstream.getInstance();
  }

  ngOnInit() {
    this.newGame.subject.subscribe((game: Game) => {
      this.game = game;
      this.record = this.client.record.getRecord(this.game.id);
      this.record.subscribe('state', this.onStateUpdate.bind(this));
      this.client.event.subscribe(`moves/${this.game.id}`, this.onMoveUpdate.bind(this));
      if (this.game.moves.length > 0) {
        setTimeout(() => this.board.replayGame(this.game));
      }
    });
    this.deepstream.getList('games').on('entry-removed', id => {
      if (this.game && this.game.id === id) {
        this.game = null;
        this.cdr.detectChanges();
      }
    });
  }

  quitGame() {
    this.record.unsubscribe('state', undefined);
    this.client.event.unsubscribe(`moves/${this.game.id}`, undefined);
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
    if (this.user.id === this.game.players.red.id || this.game.ourUserPlays && this.game.isAgainstAi) {
      this.record.set('moves', this.game.moves);
      if (this.game.state === 'over') {
        this.record.set('state', 'over');
        this.record.set('points', this.game.points);
        this.record.set('winner', this.game.winner);
      }
    }
    if (this.game.state === 'in progress' && this.game.ourUserPlays && this.game.isAgainstAi && !this.isOurTurn) {
      setTimeout(() => {
        this.client.event.emit(`moves/${this.game.id}`, this.game.nextBestMove());
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
        this.record.set('moves', []);
        this.record.set('redMovesFirst', this.game.redMovesFirst);
      }
      if (this.game.ourUserPlays && this.game.isAgainstAi && this.game.activePlayer === Bot) {
        setTimeout(() => {
          this.client.event.emit(`moves/${this.game.id}`, this.game.nextBestMove());
        }, 500);
      }
    }
    this.cdr.detectChanges();
  }

  onClickNewGame() {
    if (this.game.ourUserPlays && this.game.isAgainstAi) {
      this.record.set('state', 'in progress');
    } else {
      this.newGameBtnClicked = true;
      this.newGame.sendRematchInvitation(this.game.opponent.id, this.game.id);
    }
  }

  get isOurTurn() {
    return this.game.ourUserPlays && this.game.state === 'in progress' && this.game.activePlayer.id === this.user.id;
  }

  get turnMessage() {
    const username = this.game.activePlayer.name.replace(/ .*/, '');
    if (this.game.ourUserPlays) {
      return this.isOurTurn ? 'Your turn' : `Waiting for ${username}...`;
    }
    return `Waiting for ${username}...`;
  }

  get gameOverMessage() {
    if (this.game.state === 'over') {
      if (this.game.ourUserPlays) {
        return this.newGameBtnClicked ? `Invitation sent. Waiting for ${this.game.opponent.name}` :
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

