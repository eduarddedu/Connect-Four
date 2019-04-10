import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModule } from './login/login.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { BoardComponent } from './game/board/board.component';
import { TimerComponent } from './timer/timer.component';
import { PanelPlayersComponent } from './panels/panel-players/panel-players.component';
import { PanelGamesComponent } from './panels/panel-games/panel-games.component';
import { GameInvitationComponent } from './modals/game-invitation/game-invitation.component';
import { InvitationRejectedComponent } from './modals/invitation-rejected/invitation-rejected.component';
import { NotificationComponent } from './notification/notification.component';
import { QuitGameComponent } from './modals/quit-game/quit-game.component';
import { TrimAfterWhiteSpacePipe } from './util/trim-after-white-space.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GameComponent,
    BoardComponent,
    TimerComponent,
    PanelPlayersComponent,
    PanelGamesComponent,
    InvitationRejectedComponent,
    GameInvitationComponent,
    NotificationComponent,
    QuitGameComponent,
    TrimAfterWhiteSpacePipe
  ],
  imports: [
    BrowserModule,
    NgbModalModule,
    NgbAlertModule,
    AppRoutingModule,
    LoginModule
  ],
  providers: [],
  entryComponents: [GameInvitationComponent, InvitationRejectedComponent, QuitGameComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
