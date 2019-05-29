import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';

import { Game } from '../game/game';
import { DeepstreamService } from '../deepstream.service';
import { NewGameService } from '../new-game.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', './styles.component.css']
})
export class PanelGamesComponent implements OnInit {
  games: Set<Game> = new Set();
  private client: deepstreamIO.Client;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone,
    private newGame: NewGameService, deepstream: DeepstreamService) {
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
    this.newGame.pushGame(gameId);
  }

  private addGame(gameId: string) {
    const record = this.client.record.getRecord(gameId);
    const loadOnce = (game: Game) => {
      if (game.id) {
        record.unsubscribe(loadOnce);
        this.ngZone.run(() => this.games.add(game));
        record.subscribe('points', data => {
          game.points = data;
          this.cdr.detectChanges();
        });
      }
    };
    record.subscribe(loadOnce, true);
  }

  private removeGame(id: any) {
    this.games.forEach((game: Game) => {
      if (game.id === id) {
        this.ngZone.run(() => this.games.delete(game));
        this.cdr.detectChanges();
      }
    });
  }

}

/**
 * PanelGames displays and updates the list of on-going games.
 */

