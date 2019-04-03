import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { Game } from '../../game/game';
import { DeepstreamService } from '../../deepstream.service';

@Component({
  selector: 'app-panel-games',
  templateUrl: './panel-games.component.html',
  styleUrls: ['./panel-games.component.css', '../panels-styles.css']
})
export class PanelGamesComponent implements OnInit {
  @Input() panelVisible = true;
  @Output() joinGame: EventEmitter<string> = new EventEmitter();
  private deepstream: any;
  private games: any[] = [];

  constructor(private cdr: ChangeDetectorRef, ds: DeepstreamService) {
    this.deepstream = ds.getInstance();
  }

  ngOnInit() {
    this.deepstream.record.getList('games').whenReady((list: any) => {
      list.getEntries().forEach(this.addGame.bind(this));
      list.on('entry-added', this.addGame.bind(this));
      list.on('entry-removed', this.removeGame.bind(this));
    });
  }

  onClickGame(gameId: string) {
    this.joinGame.emit(gameId);
  }

  private addGame(gameId: any) {
    const gameRecord = this.deepstream.record.getRecord(gameId);
    const pushGame = (game: Game) => {
      if (game.id) {
        this.games.push(game);
        this.cdr.detectChanges();
        gameRecord.unsubscribe(pushGame);
        gameRecord.subscribe('points', (points: any) => {
          game.points = points;
          this.cdr.detectChanges();
        });
      }
    };
    gameRecord.subscribe(pushGame);
  }

  private removeGame(gameId: any) {
    this.games = this.games.filter(g => g.id !== gameId);
    this.cdr.detectChanges();
  }

}

