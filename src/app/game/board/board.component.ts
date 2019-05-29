import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Game } from '../game';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {
  @Input() activeColor: string;
  @Input() allowMove: boolean;
  @Output() userMoved: EventEmitter<string> = new EventEmitter();
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];

  onMouseoverInput(id: string) {
    if (!this.input(id).checked && this.allowMove) {
      this.hoistDisc(id);
    }
  }

  onMouseleaveInput(id: string) {
    if (!this.input(id).checked && this.allowMove) {
      this.hideDisc(id);
    }
  }

  onClickInput(event: any) {
    if (this.allowMove) {
      const id = event.target.name;
      const disc = this.disc(id);
      if (disc.classList.contains('disc-initial')) {
        this.hoistDisc(id);
        setTimeout(() => {
          this.dropDisc(id);
          this.userMoved.emit(id);
        }, 100);
      } else {
        this.dropDisc(id);
        this.userMoved.emit(id);
      }
    } else {
      event.preventDefault();
    }
  }

  move(id: string) {
    const input = this.input(id);
    if (!input.checked) {
      input.checked = true;
      this.hoistDisc(id);
      setTimeout(() => {
        this.dropDisc(id);
      }, 100);
    }
  }

  replayGame(game: Game) {
    this.clear();
    let colorClass = game.redMovesFirst ? 'red' : 'yellow';
    const moves = game.moves.map(id => `${id}`);
    for (let i = 0; i < moves.length; i++) {
      const id = moves[i];
      const input = this.input(id);
      input.checked = true;
      const disc = this.disc(id);
      disc.classList.remove('disc-initial');
      disc.classList.add('disc-down');
      disc.classList.add(colorClass);
      colorClass = colorClass === 'red' ? 'yellow' : 'red';
    }
  }

  clear() {
    const discs: any[] = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach(disc => {
      disc.classList.remove('disc-drop', 'disc-down', 'disc-up', 'red', 'yellow');
      disc.classList.add('disc-initial');
    });
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
  }

  private hoistDisc(id: string) {
    const disc = this.disc(id);
    disc.classList.remove('disc-initial');
    disc.classList.add('disc-up');
    disc.classList.add(this.activeColor);
  }

  private dropDisc(id: string) {
    const disc = this.disc(id);
    disc.classList.remove('disc-up');
    disc.classList.add('disc-drop');
  }

  private hideDisc(id: string) {
    this.disc(id).classList.remove('disc-up', 'red', 'yellow');
    this.disc(id).classList.add('disc-initial');
  }

  private input(name: string): any {
    return document.querySelector(`input[name="${name}"]`);
  }

  private disc(id: string): any {
    return document.getElementById(id);
  }

}
