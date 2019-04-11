import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService, User } from '../auth.service';
import { DeepstreamService } from '../deepstream.service';
import { PanelPlayersComponent } from '../panels/panel-players/panel-players.component';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { Game } from '../game/game';
import { NotificationService } from '../notification.service';
import { GameService } from '../game.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild(PanelPlayersComponent) panelPlayers: PanelPlayersComponent;
  user: User;
  showDropdownMenu = false;
  private alertMessage: string;
  private alertType: string;
  private panelsVisible = true;
  private deepstream: any;
  private game: Game;
  private opponent: User;

  constructor(private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private ngZone: NgZone,
    private ds: DeepstreamService,
    private notification: NotificationService,
    private gameService: GameService) {
  }

  ngOnInit() {
    if (this.auth.user) {
      this.user = this.auth.user;
      this.panelsVisible = true;
      this.deepstream = this.ds.getInstance();
      this.deepstream.record.getList('users').whenReady((list: any) => {
        if (!list.getEntries().includes(this.user.id)) {
          list.addEntry(this.user.id);
          const record = this.deepstream.record.getRecord(this.user.id);
          record.set(this.user);
          window.addEventListener('beforeunload', () => {
            record.delete();
            list.removeEntry(this.user.id);
          });
        }
      });
      this.gameService.newGame.subscribe(this.loadGame.bind(this));
      console.log('User: ', Object.assign(this.user));
    } else {
      this.router.navigate(['/login']);
    }
  }

  goHome() {
    if (this.game) {
      this.getGameQuitOption();
    } else {
      this.router.navigate(['/']);
      this.panelsVisible = true;
    }
  }

  getGameQuitOption() {
    const modalRef = this.modalService.open(QuitGameComponent);
    modalRef.result.then((option: any) => {
      if (option === 'Yes') {
        this.ngZone.run(() => {
          const gameId = this.game.id;
          this.deepstream.record.getRecord(this.user.id).set('status', 'Online');
          this.deepstream.record.getRecord(this.opponent.id).set('status', 'Online');
          this.unloadGame();
          this.deepstream.record.getRecord(gameId).delete();
          this.deepstream.record.getList('games').removeEntry(gameId);
          this.router.navigate(['/']);
          this.panelsVisible = true;
        });
      }
    });
  }

  loadGame(game: Game) {
    this.game = game;
    this.opponent = this.game.players.red.id !== this.user.id ? this.game.players.red : this.game.players.yellow;
    this.deepstream.record.getList('users').on('entry-removed', this.onUserOffline.bind(this));
    this.deepstream.record.getList('games').on('entry-removed', this.onGameRemoved.bind(this));
  }

  unloadGame() {
    this.game = null;
    this.opponent = null;
  }

  joinGame(gameId: string) {
    this.panelsVisible = false;
    this.router.navigate([`/game/${gameId}`]);
  }

  private onGameRemoved(gameId: string) {
    if (this.game && this.game.id === gameId) {
      this.notification.update(`${this.opponent.name} left the game`, 'danger');
      this.unloadGame();
    }
  }

  onUserOffline(userId: string) {
    if (this.opponent && this.opponent.id === userId) {
      this.notification.update(`${this.opponent.name} went offline`, 'danger');
      const gameId = this.game.id;
      this.unloadGame();
      this.deepstream.record.getList('games').removeEntry(gameId);
      this.deepstream.record.getRecord(this.user.id).set('status', 'Online');
    }
  }

  signOut() {
    this.auth.signOut();
  }

}
