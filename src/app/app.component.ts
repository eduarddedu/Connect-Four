import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  constructor(private router: Router, private auth: AuthService) { }

  ngOnInit() {
    if (environment.production) {
      this.auth.login$.subscribe(() => this.router.navigate(['/']));
      this.router.navigate(['/login']);
    }
  }
}

