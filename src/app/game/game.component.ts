import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BoardComponent } from './board/board.component';
import { DeepstreamClientManager } from '../deepstream-client-manager.service';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  dataLoaded = false;
  private username: string;
  private players: any;
  private player: any;
  private opponent: any;
  private game: any;
  private points: any;
  private deepstream: any;
  private gameId: string;
  private record: any;
  private recordDestroyed = false;
  private users: any;
  @ViewChild(BoardComponent)
  private board: BoardComponent;
  private callback: any;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private clientManager: DeepstreamClientManager) {
    this.username = this.authService.user.username;
    this.deepstream = this.clientManager.getInstance();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (this.dataLoaded) {
        this.discardGame();
      }
      this.gameId = params.get('gameId');
      if (this.deepstream.record.getList('games').getEntries().includes(this.gameId)) {
        this.record = this.deepstream.record.getRecord(this.gameId);
        this.callback = this.onRecordUpdate.bind(this);
        this.record.subscribe(this.callback, true);
        this.users = this.deepstream.record.getList('users');
        this.users.on('entry-removed', this.userOffline.bind(this));
      } else { // record was destroyed
        this.router.navigate(['']);
      }
    });
  }

  ngOnDestroy() {
    if (this.dataLoaded && !this.recordDestroyed) {
      this.record.unsubscribe(this.callback);
    }
  }

  onMove(id: string) {
    if (this.gameover(id)) {
      const key = this.board.activePlayer === this.players.red ? 'red' : 'yellow';
      this.points[`${key}`] += 1;
      this.record.set('points', this.points);
      this.record.set('game.winner', this.board.activePlayer);
      this.record.set('game.state', 'completed');
    }
    const moves = this.record.get('game.moves') || [];
    moves.push(id);
    this.record.set('game.moves', moves);
    if (moves.length === 1) {
      this.record.set('game.reset', false);
    }
  }

  onNewGame() {
    if (this.board.game.state === `waiting for ${this.username}`) {
      this.record.set('game.state', 'in progress');
      this.record.set('game.moves', []);
      this.record.set('game.reset', true);
    } else {
      this.record.set('game.state', `waiting for ${this.opponent.username}`);
    }
  }

  userOffline(username: string) {
    if (this.players && this.players.red.username === username || this.players.yellow.username === username) {
      this.recordDestroyed = true;
      this.record.set('game.state', `waiting for ${username}`); // freeze board
    }
  }

  private discardGame() {
    this.board.clearBoard();
    this.dataLoaded = false;
    this.record.unsubscribe(this.callback);
  }

  private initBoard(data: any) {
    if (data.players) { //  is data loaded to the record ?
      this.players = data.players;
      this.points = data.points;
      this.game = data.game;
      if (this.username === this.players.red.username) {
        this.player = this.players.red;
        this.opponent = this.players.yellow;
      } else if (this.username === this.players.yellow.username) {
        this.player = this.players.yellow;
        this.opponent = this.players.red;
      }
      this.dataLoaded = true;
      setTimeout(() => { // board will be ready on next VM run
        this.board.clearBoard();
        this.board.replayGame();
        this.onRecordUpdate(data);
      }, 0);
    }
  }

  private onRecordUpdate(data: any) {
    if (!this.dataLoaded) { // !this.players || this.refresh
      this.initBoard(data);
    } else {
      this.board.game = data.game;
      this.points = data.points;
      if (data.game.reset) {
        this.resetGame();
      }
      this.board.replayLastMove();
    }
  }

  private resetGame() {
    this.board.clearBoard();
    this.board.redMovesFirst = this.board.game.winner.username === this.players.red.username ? false : true;
    this.board.toggleActivePlayer(0);
  }

  private gameover(id: string) {
    return id === '62';
  }

}
