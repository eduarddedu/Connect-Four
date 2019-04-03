import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { User } from '../../auth.service';

@Component({
  selector: 'app-invitation-rejected',
  templateUrl: './invitation-rejected.component.html',
  styles: []
})
export class InvitationRejectedComponent {
  public user: User;

  constructor(public activeModal: NgbActiveModal) {}

}
