import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-game-invitation',
  templateUrl: './game-invitation.component.html',
  styles: []
})
export class GameInvitationComponent {
  public username = '';

  constructor(public activeModal: NgbActiveModal) {}

}
