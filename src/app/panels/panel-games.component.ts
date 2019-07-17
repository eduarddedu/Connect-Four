/**
 * PanelGames shows the list of on-going games in LIFO order and updates the score of each game.
 */

import { Component, OnInit } from '@angular/core';

import { Game } from '../game/game';
import { RealtimeService } from '../realtime.service';
import { WatchGameService } from '../watch-game.service';
import { IntegerSequenceGenerator } from '../util/generators';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', './styles.component.css']
})
export class PanelGamesComponent implements OnInit {
  private ascendingIntegers: Generator;
  games: Map<string, Game> = new Map();

  constructor(private watchGame: WatchGameService, private realtime: RealtimeService) {
    this.ascendingIntegers = IntegerSequenceGenerator(0);
  }

  ngOnInit() {
    this.realtime.games.all.subscribe((games: Game[]) => {
      games.forEach(this.add.bind(this));
    });
    this.realtime.games.added.subscribe(this.add.bind(this));
    this.realtime.games.removed.subscribe(this.remove.bind(this));
  }

  onClickGame(gameId: string) {
    this.realtime.games.fetchGame(gameId).subscribe((game: Game) => this.watchGame.push(game));
  }

  private add(game: Game) {
    this.games.set(game.id, Object.assign(game, { index: this.ascendingIntegers.next().value }));
    this.realtime.games.onGamePointsUpdate(game.id, this.onGamePointsChanged, this);
  }

  private remove(gameId: any) {
    this.games.delete(gameId);
  }

  private onGamePointsChanged(gameId: string, points: {red: number, yellow: number}) {
    const game = this.games.get(gameId);
    if (game) {
      game.points = points;
    }
  }

  descendingSort(a: { key: string, value: Game & { index: number } }, b: { key: string, value: Game & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}


