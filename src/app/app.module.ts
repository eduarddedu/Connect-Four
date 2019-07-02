import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import * as _ from 'deepstream.io-client-js';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { PolicyAcceptComponent } from './policy-accept/policy-accept.component';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { BoardComponent } from './game/board.component';
import { TimerComponent } from './timer/timer.component';
import { PanelPlayersComponent } from './panels//panel-players.component';
import { PanelGamesComponent } from './panels/panel-games.component';
import { GameInvitationComponent } from './modals/game-invitation.component';
import { NotificationComponent } from './notification/notification.component';
import { GameQuitComponent } from './modals/game-quit.component';
import { SurnamePipe, ReversePipe } from './util/pipes';
import { PolicyPageComponent } from './policy-page/policy-page.component';
import { GameOverComponent } from './modals/game-over.component';
import { GameCreateComponent } from './modals/game-create.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PolicyAcceptComponent,
    HomeComponent,
    GameComponent,
    BoardComponent,
    TimerComponent,
    PanelPlayersComponent,
    PanelGamesComponent,
    NotificationComponent,
    PolicyPageComponent,
    SurnamePipe,
    ReversePipe,
    GameOverComponent,
    GameCreateComponent,
    GameInvitationComponent,
    GameQuitComponent
  ],
  imports: [
    BrowserModule,
    NgbModalModule,
    NgbAlertModule,
    AppRoutingModule
  ],
  providers: [],
  entryComponents: [GameCreateComponent, GameInvitationComponent, GameQuitComponent, GameOverComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
