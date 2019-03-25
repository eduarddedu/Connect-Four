import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../auth.service';

@Component({
  selector: 'app-game-invitation',
  templateUrl: './game-invitation.component.html',
  styles: []
})
export class GameInvitationComponent {
  @Input() user: User;

  constructor(public activeModal: NgbActiveModal) {
  }

}
