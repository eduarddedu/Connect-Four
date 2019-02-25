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
  private dataLoaded = false;
  private showAlert = false;
  private alertText: string;
  private username: string;
  private red: any;
  private yellow: any;
  private client: any;
  private gameId: string;
  private gameRecord: any;
  @ViewChild(BoardComponent) boardComponent: BoardComponent;


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
          this.red = players.red;
          this.yellow = players.yellow;
          this.dataLoaded = true;
          this.cdr.detectChanges();
        }
      }, true);
    });
    this.client.record.getList('users').whenReady((list: any) => {
      list.on('entry-removed', this.userOffline.bind(this));
    });
  }

  private userOffline(username: string) {
    this.alertText = `${username} has left the game.`;
    this.showAlert = true;
    this.gameRecord.delete();
    this.client.record.getRecord(this.username).set('status', 'Online');
  }

}
