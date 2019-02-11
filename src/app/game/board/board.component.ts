import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {
  @Input() red: any;
  @Input() yellow: any;
  @Input() username: string;
  @Input() gameRecord: any;
  private activePlayer: any;
  private rows = [1, 2, 3, 4, 5, 6];
  private columns = [1, 2, 3, 4, 5, 6, 7];

  ngOnInit() {
    this.activePlayer = this.red;
    this.reset();
    this.gameRecord.subscribe('moves', (moves: string[]) => {
      if (moves.length > 0) {
        const id = moves[moves.length - 1];
        this.reactToMove(id);
      }
    });
  }

  reset() {
    this.setHoveringDiskColor();
  }

  private setHoveringDiskColor() {
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
      this.move(event.target.name);
      this.pushMove(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  private move(id: string) {
    const diskDiv = document.getElementById(id);
    diskDiv.style.color = this.activePlayer.color;
    this.toggleActivePlayer();
    this.setHoveringDiskColor();
  }

  private pushMove(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private reactToMove(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    if (this.username !== this.activePlayer.username && !input.checked) { // remote player moved
      input.checked = true;
      this.move(id);
    }
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
  }

}
