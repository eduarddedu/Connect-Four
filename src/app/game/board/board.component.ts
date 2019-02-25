import { Component, OnInit, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, AfterViewInit {
  @Input() red: any;
  @Input() yellow: any;
  @Input() username: string;
  @Input() isObserver: boolean;
  @Input() gameRecord: any;
  activePlayer: any;
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  private game = { state: 'in progress' };
  private boardEmpty = true;
  private winner: any;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.activePlayer = this.red;
  }

  ngAfterViewInit() {
    this.setHoverDiskColor();
    this.gameRecord.subscribe('moves', this.onMovesUpdate.bind(this), true);
    this.gameRecord.subscribe('game', this.onGameUpdate.bind(this), true);
  }

  private setHoverDiskColor() {
    const root = <any>document.querySelector(':root');
    const color = this.username === this.red.username ? this.red.color : this.yellow.color;
    root.style.setProperty('--hover-disk-color', color);
    this.setHoverDiskVisibility();
  }

  private setHoverDiskVisibility() {
    const root = <any>document.querySelector(':root');
    if (this.ourTurn) {
      root.style.setProperty('--hover-disk-opacity', '1');
    } else {
      root.style.setProperty('--hover-disk-opacity', '0');
    }
  }

  onClick(event: any) {
    if (this.ourTurn) {
      this.updateGame(event.target.name);
      this.updateMoves(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  private get ourTurn() {
    return this.activePlayer.username === this.username && this.game.state === 'in progress';
  }

  private move(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    input.checked = true;
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.activePlayer.color;
    this.toggleActivePlayer();
  }

  /*
    Create the dropping disc effect when the opponent makes a move.
   */

  private replayMove(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.activePlayer.color;
    const pixels = 15 + Math.floor(+id / 10) * 60;
    dropDisk.style.setProperty('top', `-${pixels}px`);
    dropDisk.style.setProperty('opacity', '1');
    setTimeout(() => {
      dropDisk.style.setProperty('top', `0`);
      input.checked = true;
      this.toggleActivePlayer();
    }, 100);
  }

  private updateMoves(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[]) {
    if (moves && moves.length > 0) {
      if (this.boardEmpty && moves.length > 1) {
        for (let i = 0; i < moves.length; i++) {
          this.move(moves[i]);
        }
      } else {
        const lastId = moves[moves.length - 1];
        if (this.ourTurn) {
          this.move(lastId);
        } else {
          this.replayMove(lastId);
        }
      }
      this.boardEmpty = false;
    }
  }

  private onGameUpdate(game: any) {
    if (game) {
      this.game = game;
    }
  }

  private updateGame(id: string) {
    if (id === '62') {
      this.gameRecord.set('game', { state: 'completed', winner: this.activePlayer });
      this.activePlayer.points = this.activePlayer.points + 1;
      this.gameRecord.set('players', { red: this.red, yellow: this.yellow });
    }
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
    this.setHoverDiskVisibility();
    this.cdr.detectChanges();
  }

}
