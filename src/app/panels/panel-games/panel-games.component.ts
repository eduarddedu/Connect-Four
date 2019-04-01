import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { User } from '../../auth.service';
import { Game } from '../../game/game';
import { DeepstreamService } from '../../deepstream.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', '../panels-styles.css']
})
export class PanelGamesComponent implements OnInit {

  @Input() user: User;
  @Input() panelVisible = true;
  @Output() joinGame: EventEmitter<string> = new EventEmitter();
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

  private addGame(id: any) {
    const gameRecord = this.deepstream.record.getRecord(id);
    const pushGame = (game: Game) => {
      if (game.id) {
        this.games.push(game);
        this.cdr.detectChanges();
        gameRecord.unsubscribe(pushGame);
        gameRecord.subscribe('points', (points: any) => {
          if (points) {
            this.games.find((g: Game) => g.id === id).points = points;
            this.cdr.detectChanges();
          }
        }, true);
      }
    };
    gameRecord.subscribe(pushGame);
  }

  private removeGame(gameId: any) {
    this.games = this.games.filter(item => item.gameId !== gameId);
    this.cdr.detectChanges();
  }

  private onClick(gameId: string) {
    this.joinGame.emit(gameId);
  }
}

