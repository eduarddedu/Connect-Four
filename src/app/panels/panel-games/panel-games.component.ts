import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { User } from '../../auth.service';
import { DeepstreamService } from '../../deepstream.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', '../panels-styles.css']
})
export class PanelGamesComponent implements OnInit {

  @Input() user: User;
  @Input() panelVisible = true;
  @Output() gameSelected: EventEmitter<{ gameId: string }> = new EventEmitter();
  @Output() gameAbandoned: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  private games: any[] = [];

  constructor(private cdr: ChangeDetectorRef, private ds: DeepstreamService) {
  }

  ngOnInit() {
    this.deepstream = this.ds.getInstance();
    this.deepstream.record.getList('games').whenReady((list: any) => {
      this.addGames(list.getEntries());
      list.on('entry-added', this.addGame.bind(this));
      list.on('entry-removed', this.removeGame.bind(this));
    });
  }

  private addGames(list: any[]) {
    list.forEach(this.addGame.bind(this));
  }

  private addGame(gameId: any) {
    const record = this.deepstream.record.getRecord(gameId);
    const pushGame = (game: any) => {
      if (game.gameId) {
        this.games.push(game);
        this.cdr.detectChanges();
        record.unsubscribe(pushGame); // don't duplicate entries
        record.subscribe('points', (points: any) => {
          if (points) {
            this.games.find(g => g.gameId === gameId).points = points;
            this.cdr.detectChanges();
          }
        }, true);
      }
    };
    record.subscribe(pushGame);
  }

  private removeGame(gameId: any) {
    const game = this.games.find((item: any) => item.gameId === gameId);
    this.games = this.games.filter(item => item.gameId !== gameId);
    this.cdr.detectChanges();
    const players = [game.players.red, game.players.yellow];
    if (players.find(u => u.id === this.user.id)) {
      const opponent = players.find((u: User) => u.id !== this.user.id);
      this.gameAbandoned.emit(opponent.name);
    }
  }

  private onClick(gameId: string) {
    this.gameSelected.emit({ gameId: gameId });
  }
}

