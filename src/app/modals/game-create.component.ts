import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User, Bot } from '../util/models';

@Component({
  selector: 'app-create-game',
  templateUrl: './game-create.component.html',
  styleUrls: ['./game-create.component.css']
})
export class GameCreateComponent {
  @Input() user: User;
  @Input() opponent: User;
  userPlaysRed = false;
  Bot: User = Bot;

  constructor(public activeModal: NgbActiveModal) { }

  switchColors() {
    this.userPlaysRed = !this.userPlaysRed;
  }

}
