import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';

import { User, Bot } from '../../util/user';
import { DeepstreamService } from '../../deepstream.service';
import { NewGameService } from 'src/app/new-game.service';


@Component({
  selector: 'app-panel-players',
  templateUrl: './panel-players.component.html',
  styleUrls: ['./panel-players.component.css', '../panels-styles.css']
})

export class PanelPlayersComponent implements OnInit {
  @Input() user: User;
  players: Map<string, User> = new Map([[Bot.id, Bot]]);
  private client: deepstreamIO.Client;

  constructor(private cdr: ChangeDetectorRef, private newGame: NewGameService, deepstream: DeepstreamService) {
    this.client = deepstream.getInstance();
  }

  ngOnInit() {
    this.client.record.getList('users').whenReady((list: any) => {
      list.getEntries().forEach(this.addPlayer.bind(this));
      list.on('entry-added', this.addPlayer.bind(this));
      list.on('entry-removed', this.removePlayer.bind(this));
    });
  }

  onClick(user: User) {
    if (user === Bot) {
      this.newGame.loadAIGame();
    } else {
      this.newGame.invite(user);
    }
  }

  private addPlayer(userId: string) {
    if (userId !== this.user.id) {
      this.client.record.getRecord(userId).subscribe((user: User) => {
        if (user.id) {
          this.players.set(user.id, user);
          this.cdr.detectChanges();
        }
      }, true);
    }
  }

  private removePlayer(userId: string) {
    this.players.delete(userId);
    this.cdr.detectChanges();
  }

}

/**
 * PanelPlayers displays online players and their status in a list which also provides the UI for sending game invitations.
 */


