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
    if (this.activePlayer.username === this.username) {
      this.updateMovesRecord(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  private move(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    input.checked = true; // make sure we replay opponent's click
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.activePlayer.color;
    this.toggleActivePlayer();
    this.toggleHoverDisk();
  }

  private updateMovesRecord(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[] = []) {
    for (let i = this.indexLastUpdate; i < moves.length; i++) {
      this.move(moves[i]);
      this.indexLastUpdate++;
    }
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
  }

}
