import { Component, OnInit, NgZone } from '@angular/core';

import { AuthService, User } from '../auth.service';
import { Router } from '@angular/router';
import { DeepstreamService } from '../deepstream.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: User;
  showAlert = false;
  private alertMessage: string;
  private alertType: string;
  private panelsVisible = true;

  constructor(private router: Router, private authService: AuthService, private ds: DeepstreamService) {

  }

  ngOnInit() {
    const user = this.authService.user;
    if (user) {
      this.user = user;
      this.panelsVisible = true;
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  goHome() {
    this.router.navigateByUrl('/');
    this.panelsVisible = true;
  }

  joinGame(invitation: { gameId: string, username?: string }) {
    if (invitation.username) {
      this.alertMessage = `${invitation.username} has accepted your invitation.`;
      this.alertType = 'success';
      this.showAlert = true;
    }
    this.panelsVisible = false;
    this.router.navigate([`/game/${invitation.gameId}`]);
  }

  onUserOffline(user: string) {
    this.alertMessage = `${user} went offline.`;
    this.alertType = 'warning';
    this.showAlert = true;
  }

  logout() {
    this.ds.signOut();
    this.authService.signOut();
  }

}
