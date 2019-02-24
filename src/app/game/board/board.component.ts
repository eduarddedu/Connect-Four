import { Component, OnInit, Input, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, AfterViewInit {
  @Input() red: any;
  @Input() yellow: any;
  @Input() username: string;
  @Input() gameRecord: any;
  activePlayer: any;
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  private indexLastUpdate = 0;

  ngOnInit() {
    this.activePlayer = this.red;
  }

  ngAfterViewInit() {
    this.toggleHoverDisk();
    this.gameRecord.subscribe('moves', this.onMovesUpdate.bind(this), true);
  }

  private toggleHoverDisk() {
    const root = <any>document.querySelector(':root');
    root.style.setProperty('--hover-disk-color', this.activePlayer.color);
    if (this.activePlayer.username === this.username) {
      root.style.setProperty('--hover-disk-opacity', '1');
    } else {
      root.style.setProperty('--hover-disk-opacity', '0');
    }
  }

  onClick(event: any) {
    if (this.ourTurn) {
      this.updateMovesRecord(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  private get ourTurn() {
    return this.activePlayer.username === this.username;
  }

  private move(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    input.checked = true;
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.activePlayer.color;
    this.toggleActivePlayer();
    this.toggleHoverDisk();
  }

  private replayMove(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.activePlayer.color;
    const pixels = 15 + Math.floor(+id / 10) * 60;
    dropDisk.style.setProperty('opacity', '1');
    dropDisk.style.setProperty('top', `-${pixels}px`);
    setTimeout(() => {
      dropDisk.style.setProperty('top', `0`);
      input.checked = true;
      this.toggleActivePlayer();
      this.toggleHoverDisk();
    }, 200);
  }

  private updateMovesRecord(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[]) {
    if (!moves) {
      return;
    }
    const weAreOneMoveBehind = moves.length - this.indexLastUpdate === 1;
    if (weAreOneMoveBehind) {
      const id = moves[moves.length - 1];
      if (this.ourTurn) {
        this.move(id);
      } else {
        this.replayMove(id);
      }
    } else {
      for (let i = this.indexLastUpdate; i < moves.length; i++) {
        const id = moves[i];
        this.move(id);
      }
    }
    this.indexLastUpdate = moves.length;
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
  }

}
