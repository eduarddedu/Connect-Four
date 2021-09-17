import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import * as _ from 'deepstream.io-client-js';

import { AppComponent } from './app.component';
import { LoginComponent } from './login.component/login.component';
import { PolicyAcceptComponent } from './policy-accept.component/policy-accept.component';
import { HomeComponent } from './home.component/home.component';
import { GameComponent } from './game.component/game.component';
import { BoardComponent } from './board.component/board.component';
import { TimerComponent } from './timer.component/timer.component';
import { PanelPlayersComponent } from './panel-players.component/panel-players.component';
import { PanelGamesComponent } from './panel-games.component/panel-games.component';
import { GameInvitationComponent } from './game-invitation.component/game-invitation.component';
import { GameOverComponent } from './game-over.component/game-over.component';
import { GameCreateComponent } from './game-create.component/game-create.component';
import { GameQuitComponent } from './game-quit.component/game-quit.component';
import { NotificationComponent } from './notification.component/notification.component';
import { SurnamePipe, ReversePipe } from './util/pipes';
import { PolicyPageComponent } from './policy-page.component/policy-page.component';
import { DropdownSelectorComponent } from './dropdown-selector.component/dropdown-selector.component';


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
    GameQuitComponent,
    DropdownSelectorComponent
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
