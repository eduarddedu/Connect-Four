import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../util/models';

@Component({
  selector: 'app-game-invitation',
  templateUrl: './game-invitation.component.html',
  styleUrls: ['./game-invitation.component.css']
})
export class GameInvitationComponent {
  @Input() user: User;

  constructor(public activeModal: NgbActiveModal) {
  }

}
