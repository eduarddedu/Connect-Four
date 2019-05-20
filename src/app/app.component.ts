import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    if (environment.production) {
      this.router.navigate(['/login']);
    }
  }
}
