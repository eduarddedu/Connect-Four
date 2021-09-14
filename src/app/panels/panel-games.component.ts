/**
 * PanelGames shows the list of on-going games in LIFO order and updates the score of each game.
 */

import { Component, OnInit } from '@angular/core';

import { Game as GameContext } from '../game/game';
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
  games: Map<string, GameContext> = new Map();

  constructor(private watchGame: WatchGameService, private realtime: RealtimeService) {
    this.ascendingIntegers = IntegerSequenceGenerator(0);
  }

  ngOnInit() {
    this.realtime.games.all.subscribe((games: GameContext[]) => {
      games.forEach(this.add.bind(this));
    });
    this.realtime.games.added.subscribe(this.add.bind(this));
    this.realtime.games.removed.subscribe(this.remove.bind(this));
  }

  onClickGame(gameId: string) {
    this.realtime.games.fetchGame(gameId).subscribe((game: GameContext) => this.watchGame.push(game));
  }

  private add(context: GameContext) {
    console.log('Panel games added');
    this.games.set(context.id, Object.assign(context, { index: this.ascendingIntegers.next().value }));
  }

  private remove(gameId: any) {
    this.games.delete(gameId);
  }

  descendingSort(a: { key: string, value: GameContext & { index: number } },
    b: { key: string, value: GameContext & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}


