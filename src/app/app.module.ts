import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModule } from './login/login.module';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BoardComponent } from './board/board.component';
import { PanelJoinGameComponent } from './panel-join-game/panel-join-game.component';
import { PanelCreateGameComponent } from './panel-create-game/panel-create-game.component';
import { InvitationJoinGameComponent } from './invitation-join-game/invitation-join-game.component';
import { InvitationRejectedComponent } from './invitation-rejected/invitation-rejected.component';
import { GameComponent } from './game/game.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BoardComponent,
    PanelJoinGameComponent,
    PanelCreateGameComponent,
    InvitationJoinGameComponent,
    InvitationRejectedComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    NgbModalModule,
    NgbAlertModule,
    AppRoutingModule,
    LoginModule
  ],
  providers: [],
  entryComponents: [InvitationJoinGameComponent, InvitationRejectedComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
