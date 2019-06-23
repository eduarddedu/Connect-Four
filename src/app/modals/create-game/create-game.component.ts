import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User, Bot } from '../../util/models';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.css']
})
export class CreateGameComponent {
  @Input() user: User;
  @Input() opponent: User;
  userPlaysRed = false;
  Bot: User = Bot;

  constructor(public activeModal: NgbActiveModal) { }

  switchColors() {
    this.userPlaysRed = !this.userPlaysRed;
  }

}
