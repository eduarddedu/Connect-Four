import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { Game } from '../game/game';
import { DeepstreamService } from '../deepstream.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-players.component.css']
})
export class PanelGamesComponent implements OnInit {
  @Output() loadGame: EventEmitter<string> = new EventEmitter();
  games: Game[] = [];
  private client: deepstreamIO.Client;

  constructor(private cdr: ChangeDetectorRef, deepstream: DeepstreamService) {
    this.client = deepstream.getInstance();
  }

  ngOnInit() {
    this.client.record.getList('games').whenReady((list: any) => {
      list.getEntries().forEach(this.addGame.bind(this));
      list.on('entry-added', this.addGame.bind(this));
      list.on('entry-removed', this.removeGame.bind(this));
    });
  }

  onClickGame(gameId: string) {
    this.loadGame.emit(gameId);
  }

  private addGame(gameId: string) {
    this.client.record.getRecord(gameId).whenReady(record => {
      const game = record.get();
      this.games.push(game);
      this.cdr.detectChanges();
      record.subscribe('points', data => {
        game.points = data;
        this.cdr.detectChanges();
      });
    });
  }

  private removeGame(gameId: any) {
    this.games = this.games.filter(game => game.id !== gameId);
    this.cdr.detectChanges();
  }

}

/**
 * PanelGames displays and updates the list of on-going games.
 */

