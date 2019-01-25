import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BoardComponent } from '../board/board.component';
import { DeepstreamClientManager } from '../deepstream-client-manager.service';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  private username: string;
  private opponent: string;
  private client: any;
  private showPlayerQuitAlert = false;
  private gameId: string;
  private isGameObserver: boolean;
  private gameRecord: any;
  private redPlayer: string;
  private yellowPlayer: string;


  constructor(private route: ActivatedRoute, private authService: AuthService, private clientManager: DeepstreamClientManager) {
    this.username = this.authService.user.username;
    this.client = this.clientManager.getInstance();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.gameId = params.get('gameId');
      this.gameRecord = this.client.record.getRecord(this.gameId);
      this.gameRecord.subscribe('details', (data: any) => {
        this.redPlayer = data.redPlayer;
        this.yellowPlayer = data.yellowPlayer;
        if (this.username === this.redPlayer) {
          this.opponent = this.yellowPlayer;
        } else if (this.username === this.yellowPlayer) {
          this.opponent = this.redPlayer;
        } else {
          this.isGameObserver = true;
        }
      });
    });
    this.client.record.getList('users').whenReady((list: any) => {
      list.on('entry-removed', this.userOffline.bind(this));
    });
  }

  private userOffline(username: string) {
    if (username === this.opponent) {
      this.showPlayerQuitAlert = true;
      this.gameRecord.delete();
    }
  }

}
