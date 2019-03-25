import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BoardComponent } from './board/board.component';
import { DeepstreamService } from '../deepstream.service';
import { AuthService, User } from '../auth.service';

type Player = User & { color: string };

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  gameLoaded = false;
  private user: User;
  private players: { red: Player, yellow: Player };
  private player: Player;
  private opponent: Player;
  private game: any;
  private points: { red: number, yellow: number };
  private deepstream: any;
  private gameId: string;
  private record: any;
  private recordDestroyed = false;
  @ViewChild(BoardComponent)
  private board: BoardComponent;
  private callback: any;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private ds: DeepstreamService) {
    this.deepstream = this.ds.getInstance();
    this.user = this.authService.user;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (this.gameLoaded) {
        this.discardGame();
      }
      this.gameId = params.get('gameId');
      if (this.deepstream.record.getList('games').getEntries().includes(this.gameId)) {
        this.record = this.deepstream.record.getRecord(this.gameId);
        this.callback = this.onRecordUpdate.bind(this);
        this.record.subscribe(this.callback, true);
        this.deepstream.record.getList('users').on('entry-removed', this.userOffline.bind(this));
      } else { // record was destroyed
        this.router.navigateByUrl('/');
      }
    });
  }

  ngOnDestroy() {
    if (this.gameLoaded && !this.recordDestroyed) {
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
    if (this.board.game.state === `waiting for ${this.user.name}`) {
      this.record.set('game.state', 'in progress');
      this.record.set('game.moves', []);
      this.record.set('game.reset', true);
    } else {
      this.record.set('game.state', `waiting for ${this.opponent.name}`);
    }
  }

  private userOffline(userId: string) {
    if (this.players) {
      const offlinePlayer = [this.players.red, this.players.yellow].find(u => u.id === userId);
      if (offlinePlayer) {
        this.recordDestroyed = true;
        this.record.set('game.state', `waiting for ${offlinePlayer.name}`); // this will freeze the board
      }
    }
  }

  private discardGame() {
    this.board.clearBoard();
    this.gameLoaded = false;
    this.record.unsubscribe(this.callback);
  }

  private initBoard(data: any) {
    if (data.players) {
      this.players = data.players;
      this.points = data.points;
      this.game = data.game;
      const players = [this.players.red, this.players.yellow];
      if (players.map((p: Player) => p.id).includes(this.user.id)) {
        this.player = players.find((p: Player) => p.id === this.user.id);
        this.opponent = players.find((p: Player) => p.id !== this.user.id);
      }
      this.gameLoaded = true;
      setTimeout(() => {
        this.board.clearBoard();
        this.board.replayGame();
        this.onRecordUpdate(data);
      }, 0);
    }
  }

  private onRecordUpdate(data: any) {
    if (!this.gameLoaded) {
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
    this.board.redMovesFirst = this.board.game.winner.name === this.players.red.name ? false : true;
    this.board.toggleActivePlayer(0);
  }

  private gameover(id: string) {
    return id === '62';
  }

}
