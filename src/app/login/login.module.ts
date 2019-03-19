import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';

@NgModule({
    declarations: [
        LoginComponent
    ],
    imports: [
        ReactiveFormsModule,
        CommonModule
    ],
    providers: [],
    bootstrap: [LoginComponent]
})
export class LoginModule { }
