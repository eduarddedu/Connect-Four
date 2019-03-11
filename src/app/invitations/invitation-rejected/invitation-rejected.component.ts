import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invitation-rejected',
  templateUrl: './invitation-rejected.component.html',
  styles: []
})
export class InvitationRejectedComponent {
  public username = '';

  constructor(public activeModal: NgbActiveModal) {}

}
