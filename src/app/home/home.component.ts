import { Component, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '../auth-service.service';
import { Router } from '@angular/router';
import { PanelJoinGameComponent } from '../panel-join-game/panel-join-game.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private user: any;
  @ViewChild(PanelJoinGameComponent) panelJoin: PanelJoinGameComponent;

  constructor(authService: AuthService, private router: Router) {
    if ((this.user = authService.user) === AuthService.defaultUser) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {}

  goHome() {
    this.router.navigate(['/']);
    this.panelJoin.visible = true;
  }

}
