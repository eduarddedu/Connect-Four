import { Component, OnInit, ViewChild } from '@angular/core';
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
  private dataLoaded = false;
  private showAlert = false;
  private alertText: string;
  private username: string;
  private opponent: string;
  private red: any;
  private yellow: any;
  private activePlayer: any;
  private client: any;
  private gameId: string;
  private isObserver: boolean;
  private gameRecord: any;
  @ViewChild(BoardComponent) boardComponent: BoardComponent;


  constructor(private route: ActivatedRoute, private authService: AuthService, private clientManager: DeepstreamClientManager) {
    this.username = this.authService.user.username;
    this.client = this.clientManager.getInstance();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.gameId = params.get('gameId');
      this.gameRecord = this.client.record.getRecord(this.gameId);
      this.gameRecord.subscribe('players', (players: any) => {
        if (players) {
          this.red = players.red;
          this.yellow = players.yellow;
          this.activePlayer = this.red;
          if (this.username === players.red.username) {
            this.opponent = players.yellow.username;
          } else if (this.username === players.yellow.username) {
            this.opponent = players.red.username;
          } else {
            this.isObserver = true;
          }
          this.dataLoaded = true;
        }
      }, true);
    });
    this.client.record.getList('users').whenReady((list: any) => {
      list.on('entry-removed', this.userOffline.bind(this));
    });
  }

  private userOffline(username: string) {
    if (username === this.opponent) {
      this.alertText = `Oh shucks! ${username} has left the game.`;
      this.showAlert = true;
      this.gameRecord.delete();
      this.client.record.getRecord(this.username).set('status', 'Online');
    }
  }

}
