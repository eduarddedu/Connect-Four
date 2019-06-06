import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';

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
  private index = (function () {
    const Generator = function* () {
      let counter = 0;
      while (true) {
        yield counter++;
      }
    };
    return Generator();
  })();

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone,
    private newGame: NewGameService, private deepstream: DeepstreamService) {
    this.client = deepstream.getInstance();
    this.newGame.subject.subscribe((game: Game) => this.game = game);
  }

  ngOnInit() {
    this.client.record.getList('users').whenReady(async (list: any) => {
      const ids: string[] = list.getEntries();
      for (const userId of ids) {
        await this.addUser(userId);
      }
      list.on('entry-added', this.addUser.bind(this));
      list.on('entry-removed', this.removeUser.bind(this));
      if (!ids.includes(this.user.id)) {
        list.addEntry(this.user.id);
        this.deepstream.getRecord(this.user.id).set(this.user);
        window.addEventListener('beforeunload', this.signOut.bind(this));
      }
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

  private addUser(userId: string): Promise<any> {
    return new Promise(resolve => {
      if (userId !== this.user.id) {
        const record = this.client.record.getRecord(userId);
        const loadOnce = (user: User) => {
          if (user.id) {
            this.ngZone.run(() => {
              this.users.set(user.id, Object.assign(user, { index: this.index.next().value }));
              resolve();
            });
            record.unsubscribe(loadOnce);
            record.subscribe('status', status => {
              this.users.get(userId).status = status;
              this.cdr.detectChanges();
            });
          }
        };
        record.subscribe(loadOnce, true);
      }
    });
  }

  private removeUser(userId: string) {
    this.users.delete(userId);
    this.cdr.detectChanges();
  }

  descendingSort(a: { key: string, value: User & { index: number } }, b: { key: string, value: User & { index: number } }): number {
    return a.value.index < b.value.index ? 1 : -1;
  }

}

/**
 * PanelPlayers displays online players and their status in a list which also provides the UI for sending game invitations.
 */


