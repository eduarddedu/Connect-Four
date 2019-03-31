import { Component, OnInit } from '@angular/core';

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
  private deepstream: any;

  constructor(private router: Router, private auth: AuthService, private ds: DeepstreamService) {

  }

  ngOnInit() {
    if (this.auth.user) {
      this.user = this.auth.user;
      this.panelsVisible = true;
      this.deepstream = this.ds.getInstance();
      console.log('User: ', Object.assign(this.user));
    } else {
      this.router.navigate(['/login']);
    }
  }

  goHome() {
    this.router.navigateByUrl('/');
    this.panelsVisible = true;
  }

  joinGame(gameId: string) {
    this.panelsVisible = false;
    this.router.navigateByUrl(`/game/${gameId}`);
  }

  logout() {
    this.ds.signOut();
    this.auth.signOut();
  }

}
