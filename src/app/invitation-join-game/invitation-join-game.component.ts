import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invitation-join-game',
  templateUrl: './invitation-join-game.component.html',
  styleUrls: ['./invitation-join-game.component.css']
})
export class InvitationJoinGameComponent {
  username = '';

  constructor(public activeModal: NgbActiveModal) {}

}
