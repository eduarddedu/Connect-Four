import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
  showAlert = false;
  alertText: string;
  private username: string;
  private players: any;
  private player: any;
  private opponent: any;
  private points = { red: 0, yellow: 0 };
  private client: any;
  private gameId: string;
  private gameRecord: any;
  private usersList: any;
  private gameRecordDestroyed = false;
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
      this.usersList = this.client.record.getList('users');
      this.gameRecord.subscribe('players', (players: any) => {
        if (players) {
          this.players = players;
          if (this.username === players.red.username) {
            this.player = players.red;
            this.opponent = players.yellow;
          } else if (this.username === players.yellow.username) {
            this.player = players.yellow;
            this.opponent = players.red;
          }
          this.gameRecord.unsubscribe('players');
          this.dataLoaded = true;
          this.cdr.detectChanges();
        }
      }, true);
    });
    this.usersList.on('entry-removed', this.onUserOffline.bind(this));
    this.gameRecord.subscribe('game', this.onGameUpdate.bind(this), true);
    this.gameRecord.subscribe('points', this.onPointsUpdate.bind(this), true);
  }

  ngOnDestroy() {
    if (!this.gameRecordDestroyed) {
      this.gameRecord.unsubscribe('game');
      this.gameRecord.unsubscribe('points');
    }
    this.usersList.unsubscribe(this.onUserOffline.bind(this));
  }

  onMove(id: string) {
    this.updateGame(id);
  }

  private updateGame(id: string) {
    if (this.gameover(id)) {
      const key = this.board.activePlayer === this.players.red ? 'red' : 'yellow';
      this.points[`${key}`] += 1;
      this.gameRecord.set('points', this.points);
      this.gameRecord.set('game.winner', this.board.activePlayer);
      this.gameRecord.set('game.state', 'over');
    }
    const moves = this.gameRecord.get('game.moves') || [];
    moves.push(id);
    this.gameRecord.set('game.moves', moves);
  }

  private onGameUpdate(game: any) {
    if (game) {
      const resetGame = this.board.game.state === 'on hold' && game.state === 'in progress';
      const replayLastMove = this.board.game.moves.length === game.moves.length - 1;
      this.board.game = game;
      if (resetGame) {
        this.resetGame();
      }
      if (!this.board.waitingForOpponent) {
        this.updateBoard(replayLastMove);
      }
    }
  }

  private resetGame() {
    this.board.redMovesFirst = this.board.game.winner.username === this.players.red.username ? false : true;
    this.board.waitingForOpponent = false;
    this.board.setActivePlayer(0);
  }

  private updateBoard(replayLastMove: boolean) {
    if (replayLastMove) {
      this.board.replayLastMove();
    } else {
      this.board.replayGame();
    }
  }

  private onPointsUpdate(points: { red: number, yellow: number }) {
    if (points) {
      this.points = points;
    }
  }

  onNewGame() {
    if (this.board.game.state === 'on hold') {
      this.gameRecord.set('game.moves', []);
      this.gameRecord.set('game.state', 'in progress');
    } else {
      this.gameRecord.set('game.state', 'on hold');
    }
  }

  onUserOffline(username: string) {
    if (this.opponent && username === this.opponent.username) {
      this.gameRecord.delete();
      this.client.record.getRecord(this.username).set('status', 'Online');
      this.alertText = `${username} has left the game.`;
      this.showAlert = true;
      this.gameRecordDestroyed = true;
    }
  }

  private gameover(id: string) {
    return id === '62';
  }

}
