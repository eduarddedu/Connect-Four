import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { User } from '../util/user';
import { DeepstreamService } from '../deepstream.service';
import { NewGameService } from 'src/app/new-game.service';
import { Game } from '../game/game';


@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', './styles.component.css']
})

export class PanelPlayersComponent implements OnInit, OnDestroy {
  @Input() user: User;
  users: Map<string, User> = new Map();
  private game: Game;
  private client: deepstreamIO.Client;

  constructor(private cdr: ChangeDetectorRef, private newGame: NewGameService, private deepstream: DeepstreamService) {
    this.client = deepstream.getInstance();
    this.newGame.subject.subscribe((game: Game) => this.game = game);
  }

  ngOnInit() {
    this.client.record.getList('users').whenReady((list: any) => {
      if (!list.getEntries().includes(this.user.id)) {
        list.addEntry(this.user.id);
        this.deepstream.getRecord(this.user.id).set(this.user);
        window.addEventListener('beforeunload', this.signOut.bind(this));
      }
      list.getEntries().forEach(this.addPlayer.bind(this));
      list.on('entry-added', this.addPlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
  }

  ngOnDestroy() {
    this.signOut();
  }

  private signOut() {
    this.deepstream.getRecord(this.user.id).delete();
    this.deepstream.getList('users').removeEntry(this.user.id);
    if (this.game && this.game.ourUserPlays) {
      this.deepstream.getRecord(this.game.id).delete();
      this.deepstream.getList('games').removeEntry(this.game.id);
      if (!this.game.isAgainstAi) {
        this.deepstream.getRecord(this.game.opponent.id).set('status', 'Online');
      }
    }
  }

  onClick(user: User) {
    this.newGame.invite(user);
  }

  private addPlayer(userId: string) {
    if (userId !== this.user.id) {
      const record = this.client.record.getRecord(userId);
      const loadOnce = (user: User) => {
        if (user.id) {
          this.users.set(user.id, user);
          this.cdr.detectChanges();
          record.unsubscribe(loadOnce);
          record.subscribe('status', status => {
            this.users.get(userId).status = status;
            this.cdr.detectChanges();
          });
        }
      };
      record.subscribe(loadOnce, true);
    }
  }

  private removePlayer(userId: string) {
    this.users.delete(userId);
    this.cdr.detectChanges();
  }

}

/**
 * PanelPlayers displays online players and their status in a list which also provides the UI for sending game invitations.
 */


