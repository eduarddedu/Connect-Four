import { Component, OnInit } from '@angular/core';
import { Game as Game } from '../game';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {
  readonly config: {
    red: '#ff010b',
    yellow: '#ffd918'
  };
  red = '#ff010b';
  yellow = '#ffd918';
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  game: Game;

  ngOnInit() {
    this.reset();
  }

  reset() {
    this.game = new Game(this.red, this.yellow);
    this.setHoveringDiskColor(this.red);
  }

  private setHoveringDiskColor(color: string) {
    const rootElement = <any>document.querySelector(':root');
    rootElement.style.setProperty('--hover-disk-color', color);
  }

  onClick(id: string) {
    const dropDisk = document.getElementById(id);
    dropDisk.style.color = this.game.currentColor;
    this.setHoveringDiskColor(this.game.next().currentColor);
  }

}
