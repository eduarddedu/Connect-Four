import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Game } from 'src/app/game/game';
import { User } from 'src/app/util/models';

@Component({
  selector: 'app-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: []
})
export class GameOverComponent {
  @Input() game: Game;
  @Input() user: User;

  constructor(public activeModal: NgbActiveModal) { }

}
