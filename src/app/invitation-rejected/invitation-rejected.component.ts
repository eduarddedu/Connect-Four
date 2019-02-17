import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invitation-rejected',
  templateUrl: './invitation-rejected.component.html',
  styleUrls: ['./invitation-rejected.component.css']
})
export class InvitationRejectedComponent {
  username = '';

  constructor(public activeModal: NgbActiveModal) { }

}
