import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-quit-game',
  templateUrl: './game-quit.component.html',
  styles: []
})
export class GameQuitComponent {

  constructor(public activeModal: NgbActiveModal) { }

}
