import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Game } from '../game/game';

@Injectable({
  providedIn: 'root'
})
export class WatchGameService {
  selected: Subject<Game> = new Subject();

  constructor() { }

  push(game: Game) {
    this.selected.next(game);
  }
}
