import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { DeepstreamClientManager } from '../../deepstream-client-manager.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', '../panels-styles.css']
})
export class PanelGamesComponent implements OnInit {

  @Input() username: string;
  @Input() panelVisible = true;
  @Output() gameSelected: EventEmitter<{ gameId: string }> = new EventEmitter();
  @Output() gameAbandoned: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  listGames: any[] = [];

  constructor(private cdr: ChangeDetectorRef, private clientManager: DeepstreamClientManager) {
  }

  ngOnInit() {
    this.deepstream = this.clientManager.getInstance();
    this.deepstream.record.getList('games').whenReady((list: any) => {
      this.addGames(list.getEntries());
      list.on('entry-added', this.addGame.bind(this));
      list.on('entry-removed', this.removeGame.bind(this));
    });
  }

  private addGames(list: any[]) {
    list.forEach(this.addGame.bind(this));
  }

  private addGame(gameId: any) {
    const record = this.deepstream.record.getRecord(gameId);
    const pushGame = (game: any) => {
      if (game.gameId) {
        this.listGames.push(game);
        this.cdr.detectChanges();
        record.unsubscribe(pushGame); // don't duplicate entries
        record.subscribe('points', (points: any) => {
          if (points) {
            this.listGames.find(g => g.gameId === gameId).points = points;
            this.cdr.detectChanges();
          }
        }, true);
      }
    };
    record.subscribe(pushGame);
  }

  private removeGame(gameId: any) {
    const game = this.listGames.find((g: any) => g.gameId === gameId);
    this.listGames = this.listGames.filter(g => g !== game);
    this.cdr.detectChanges();
    if (game.players.red.username === this.username) {
      this.gameAbandoned.emit(game.players.yellow.username);
    } else if (game.players.yellow.username === this.username) {
      this.gameAbandoned.emit(game.players.red.username);
    }
  }

  private onClick(gameId: string) {
    this.gameSelected.emit({ gameId: gameId });
  }
}

