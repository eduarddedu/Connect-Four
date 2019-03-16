import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth-service.service';
import { Router } from '@angular/router';
import { DeepstreamClientManager } from '../deepstream-client-manager.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: any;
  private showAlert = false;
  private alertMessage: string;
  private alertType: string;
  private panelsVisible = true;

  constructor(
    private router: Router, private authService: AuthService, private dsc: DeepstreamClientManager) {
    this.user = authService.user;
  }

  ngOnInit() {
    if (!this.user) {
      this.router.navigate(['/login']);
    } else {
      const deepstream = this.dsc.getInstance();
      deepstream.on('error', (error: any, event: any) => {
        this.alertMessage = `Deepstream ${event}`;
        this.alertType = 'danger';
        this.showAlert = true;
      });
    }
  }

  private goHome() {
    this.router.navigate(['/']);
    this.panelsVisible = true;
  }

  private joinGame(data: { gameId: string, invitee?: string }) {
    if (data.invitee) {
      this.alertMessage = `${data.invitee} has accepted your invitation.`;
      this.alertType = 'success';
      this.showAlert = true;
    }
    this.panelsVisible = false;
    this.router.navigate([`/game/${data.gameId}`]);
  }

  private onUserOffline(user: string) {
    this.alertMessage = `${user} went offline.`;
    this.alertType = 'warning';
    this.showAlert = true;
  }

}
