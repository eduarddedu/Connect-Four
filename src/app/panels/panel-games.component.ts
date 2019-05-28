import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { Game } from '../game/game';
import { DeepstreamService } from '../deepstream.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', './styles.component.css']
})
export class PanelGamesComponent implements OnInit {
  @Output() loadGame: EventEmitter<string> = new EventEmitter();
  games: Game[] = [];
  private client: deepstreamIO.Client;

  constructor(deepstream: DeepstreamService) {
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
      let game = record.get();
      this.games.push(game);
      this.games = [...this.games];
      record.subscribe('points', data => {
        game.points = data;
        game = Object.assign(game, {points: data});
      });
    });
  }

  private removeGame(gameId: any) {
    this.games = this.games.filter(game => game.id !== gameId);
  }

}

/**
 * PanelGames displays and updates the list of on-going games.
 */

