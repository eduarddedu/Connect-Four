import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService, User } from '../auth.service';
import { DeepstreamService } from '../deepstream.service';
import { QuitGameComponent } from '../modals/quit-game/quit-game.component';
import { NotificationService } from '../notification.service';
import { GameComponent } from '../game/game.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  gameCompRef: GameComponent;
  user: User;
  showDropdownMenu = false;
  private panelsVisible = true;
  private ds: deepstreamIO.Client;

  constructor(private router: Router,
    private modalService: NgbModal,
    private auth: AuthService,
    private ngZone: NgZone,
    private deepstreamService: DeepstreamService,
    private notification: NotificationService) {
  }

  ngOnInit() {
    if (this.auth.user) {
      this.user = this.auth.user;
      this.panelsVisible = true;
      this.ds = this.deepstreamService.getInstance();
      this.ds.record.getList('games').on('entry-removed', this.onGameRecordDelete.bind(this));
      this.ds.record.getList('users').whenReady(list => {
        if (!list.getEntries().includes(this.user.id)) {
          list.addEntry(this.user.id);
          const record = this.ds.record.getRecord(this.user.id);
          record.set(this.user);
          window.addEventListener('beforeunload', this.signoutDeepstream.bind(this));
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  goHome() {
    if (this.gameCompRef && this.gameCompRef.record && this.gameCompRef.isPlayer) {
      this.getGameQuitOption();
    } else {
      this.router.navigate(['/']);
      this.panelsVisible = true;
      this.gameCompRef = null;
    }
  }

  getGameQuitOption() {
    const modalRef = this.modalService.open(QuitGameComponent);
    modalRef.result.then((option: any) => {
      if (option === 'Yes') {
        this.ds.record.getRecord(this.user.id).set('status', 'Online');
        this.ds.record.getRecord(this.gameCompRef.opponent.id).set('status', 'Online');
        this.ds.record.getList('games').removeEntry(this.gameCompRef.game.id);
        this.ds.record.getRecord(this.gameCompRef.game.id).delete();
        this.panelsVisible = true;
        this.ngZone.run(() => this.router.navigate(['/']));
      }
    });
  }

  onGameLoad(gameComponentRef: GameComponent) {
    this.gameCompRef = gameComponentRef;
  }

  joinGame(gameId: string) {
    this.panelsVisible = false;
    this.router.navigate([`/game/${gameId}`]);
  }

  // can't use GameComponent.record.on('delete', fn) because callback is not called (Deepstream bug)
  onGameRecordDelete(gameId: string) {
    if (this.gameCompRef && this.gameCompRef.game.id === gameId && !this.gameCompRef.game.isAgainstAi) {
      this.notification.update(`Game over. Opponent abandoned`, 'danger');
      if (this.gameCompRef.isPlayer) {
        this.ds.record.getRecord(this.user.id).set('status', 'Online');
      }
    }
  }

  signout() {
    this.auth.signout();
    this.signoutDeepstream();
  }

  signoutDeepstream() {
    this.ds.record.getRecord(this.user.id).delete();
    this.ds.record.getList('users').removeEntry(this.user.id);
    if (this.gameCompRef && this.gameCompRef.isPlayer && this.gameCompRef.record) {
      this.ds.record.getRecord(this.gameCompRef.game.id).delete();
      this.ds.record.getList('games').removeEntry(this.gameCompRef.game.id);
    }
    this.ds.close();
  }

}
