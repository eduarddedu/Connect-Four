import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BoardComponent } from './board/board.component';
import { DeepstreamClientManager } from '../deepstream-client-manager.service';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  dataLoaded = false;
  showAlert = false;
  alertText: string;
  private username: string;
  private players: any;
  private player: any;
  private opponent: any;
  private activePlayer: any;
  private points = { red: 0, yellow: 0 };
  private client: any;
  private gameId: string;
  private gameRecord: any;
  private game: { state: 'in progress' | 'on hold' | 'over' } = { state: 'in progress' };
  @ViewChild(BoardComponent) board: BoardComponent;


  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private authService: AuthService,
    private clientManager: DeepstreamClientManager) {
    this.username = this.authService.user.username;
    this.client = this.clientManager.getInstance();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.gameId = params.get('gameId');
      this.gameRecord = this.client.record.getRecord(this.gameId);
      this.gameRecord.subscribe('players', (players: any) => {
        if (players) {
          this.players = players;
          this.activePlayer = players.red;
          if (this.username === players.red.username) {
            this.player = players.red;
            this.opponent = players.yellow;
          } else if (this.username === players.yellow.username) {
            this.player = players.yellow;
            this.opponent = players.red;
          }
          this.dataLoaded = true;
          this.cdr.detectChanges();
        }
      }, true);
    });
    this.client.record.getList('users').whenReady((list: any) => {
      list.on('entry-removed', this.onUserOffline.bind(this));
    });
    this.gameRecord.subscribe('moves', this.onMovesUpdate.bind(this), true);
    this.gameRecord.subscribe('game', this.onGameUpdate.bind(this), true);
    this.gameRecord.subscribe('points', this.onPointsUpdate.bind(this), true);
  }

  onMove(id: string) {
    this.updateGame(id);
    this.updateMoves(id);
  }

  private updateGame(id: string) {
    if (this.gameover(id)) {
      const key = this.activePlayer === this.players.red ? 'red' : 'yellow';
      this.points[`${key}`] += 1;
      this.gameRecord.set('points', this.points);
      this.gameRecord.set('game', { state: 'over', winner: this.activePlayer });
    }
  }

  private updateMoves(id: string) {
    const moves = this.gameRecord.get('moves') || [];
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[] = []) {
    if (moves.length !== 0) {
      if (this.board.isEmpty && moves.length > 1) {
        this.board.replayGame(moves);
      } else {
        const id = moves[moves.length - 1];
        this.board.replayMove(id);
      }
      this.activePlayer = moves.length % 2 === 0 ? this.players.red : this.players.yellow;
      this.board.isEmpty = false;
    }
  }

  private onGameUpdate(game: any) {
    if (game) {
      this.game = game;
    }
  }

  private onPointsUpdate(points: {red: number, yellow: number}) {
    if (points) {
      this.points = points;
    }
  }

  onNewGame() {
    if (this.game.state === 'on hold') {
      this.gameRecord.set('moves', []);
      this.activePlayer = this.username === this.players.red.username ? this.players.red : this.players.yellow;
      this.gameRecord.set('game.state', 'in progress');
    } else {
      this.gameRecord.set('game.state', 'on hold');
      this.activePlayer = this.opponent === this.players.red ? this.players.red : this.players.yellow;
    }
  }

  onUserOffline(username: string) {
    this.gameRecord.delete();
    this.client.record.getRecord(this.username).set('status', 'Online');
    this.alertText = `${username} has left the game.`;
    this.showAlert = true;
  }

  private gameover(id: string) {
    return id === '62';
  }

}
