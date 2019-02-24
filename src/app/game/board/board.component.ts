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
  private indexLastUpdate = 0;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.activePlayer = this.red;
  }

  ngAfterViewInit() {
    this.setHoverDiskColor();
    this.gameRecord.subscribe('moves', this.onMovesUpdate.bind(this), true);
  }

  private setHoverDiskColor() {
    const root = <any>document.querySelector(':root');
    const color = this.username === this.red.username ? this.red.color : this.yellow.color;
    root.style.setProperty('--hover-disk-color', color);
    this.setHoverDiskVisibility();
  }

  private setHoverDiskVisibility() {
    const root = <any>document.querySelector(':root');
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

  private updateMovesRecord(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[]) {
    if (moves && moves.length !== 0) {
      if (this.indexLastUpdate === 0) {
        for (let i = 0; i < moves.length; i++) {
          const id = moves[i];
          this.move(id);
        }
        this.indexLastUpdate = moves.length;
      } else {
        const idLastMove = moves[moves.length - 1];
        if (this.ourTurn) {
          this.move(idLastMove);
        } else {
          this.replayMove(idLastMove);
        }
      }
    }
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
    this.setHoverDiskVisibility();
    this.cdr.detectChanges();
  }

}
