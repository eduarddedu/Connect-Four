import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../auth-service.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = fb.group({
      username: [null, Validators.required],
      password: [null, Validators.required]
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    const user = {
      username: this.loginForm.get('username').value,
      password: this.loginForm.get('password').value
    };
    if (this.authService.authenticate(user)) {
      this.router.navigate(['/']);
    } else {
      // TODO handle sign-in error
    }
  }
}
