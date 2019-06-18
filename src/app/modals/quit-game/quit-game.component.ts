import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-quit-game',
  templateUrl: './quit-game.component.html',
  styles: []
})
export class QuitGameComponent {

  constructor(public activeModal: NgbActiveModal) { }

}
