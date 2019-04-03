import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Game } from './game/game';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  subjectNewGame: Subject<Game> = new Subject();
  newGame: Observable<Game> = this.subjectNewGame.asObservable();

  push(game: Game) {
    this.subjectNewGame.next(game);
  }
}
