import { Component, OnInit, NgZone } from '@angular/core';

import { AuthService, User } from '../auth.service';
import { Router } from '@angular/router';
import { DeepstreamService } from '../deepstream.service';


declare const gapi: any;

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

  constructor(private zone: NgZone, private router: Router, private authService: AuthService, private ds: DeepstreamService) {

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

  joinGame(data: { gameId: string, invitee?: string }) {
    if (data.invitee) {
      this.alertMessage = `${data.invitee} has accepted your invitation.`;
      this.alertType = 'success';
      this.showAlert = true;
    }
    this.panelsVisible = false;
    this.router.navigate([`/game/${data.gameId}`]);
  }

  onUserOffline(user: string) {
    this.alertMessage = `${user} went offline.`;
    this.alertType = 'warning';
    this.showAlert = true;
  }

  logout() {
    this.ds.signOut();
    this.authService.signOut();
    this.runOutsideAngular(() => this.router.navigateByUrl('/login'));
  }

  private runOutsideAngular(callback: () => {}) {
    this.zone.runOutsideAngular(callback);
  }

}
