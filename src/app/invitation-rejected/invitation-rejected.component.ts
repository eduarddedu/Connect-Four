import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invitation-rejected',
  templateUrl: './invitation-rejected.component.html',
  styleUrls: ['./invitation-rejected.component.css']
})
export class InvitationRejectedComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal) {

  }

  ngOnInit() {
  }

}
