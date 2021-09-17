import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Color } from '../game/engine';

import { User, Bot } from '../util/models';

@Component({
  selector: 'app-create-game',
  templateUrl: './game-create.component.html',
  styleUrls: ['./game-create.component.css']
})
export class GameCreateComponent {
  @Input() user: User;
  @Input() opponent: User;
  userPlaysRed = true;
  redMovesFirst = true;
  Bot: User = Bot;
  dropdownOptions = [
    { key: 'Red moves first', selected: true, value: Color.RED },
    { key: 'Yellow moves first', selected: false, value: Color.YELLOW }];
  constructor(public activeModal: NgbActiveModal) {

  }

  switchColors() {
    this.userPlaysRed = !this.userPlaysRed;
  }

  onChangeInitialGameState(color: Color) {
    this.redMovesFirst = color === Color.RED ? true : false;
  }

}
