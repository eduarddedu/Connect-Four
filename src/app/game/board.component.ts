import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Game } from './game';
import { RangeX, RangeY, Color, Move, State } from './engine';
import { User } from '../util/models';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent {
  @Input() game: Game;
  @Input() user: User;
  @Output() userMoved: EventEmitter<Move> = new EventEmitter();
  rows = [0, 1, 2, 3, 4, 5];
  columns = [0, 1, 2, 3, 4, 5, 6];

  onMouseoverInput(id: string) {
    if (!this.input(id).checked && this.allowMove) {
      const color = this.game.state === State.RED_MOVES ? Color.RED : Color.YELLOW;
      this.hoverDisc(id, color);
    }
  }

  onMouseleaveInput(id: string) {
    if (!this.input(id).checked && this.allowMove) {
      this.hideDisc(id);
    }
  }

  onClickInput(event: any) {
    if (this.allowMove) {
      const id: string = event.target.name;
      const disc = this.disc(id);
      const color = this.game.state === State.RED_MOVES ? Color.RED : Color.YELLOW;
      const move = this.moveIdToMove(+id, color);
      if (disc.classList.contains('disc-initial')) {
        this.hoverDisc(id, color);
        setTimeout(() => {
          this.dropDisc(id);
          this.userMoved.emit(move);
        }, 100);
      } else {
        this.dropDisc(id);
        this.userMoved.emit(move);
      }
    } else {
      event.preventDefault();
    }
  }

  update() {
    const move = this.game.lastMove;
    const id = this.moveToMoveId(move);
    const input = this.input(id);
    if (!input.checked) {
      input.checked = true;
      this.hoverDisc(id, move.color);
      setTimeout(() => {
        this.dropDisc(id);
      }, 100);
    }
  }

  replayGame() {
    this.clear();
    let colorClass = this.game.context.initialState === State.RED_MOVES ? 'red' : 'yellow';
    const moves = this.game.moves.map(id => `${id}`);
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


  private hoverDisc(id: string, color: Color) {
    const disc = this.disc(id);
    disc.classList.remove('disc-initial');
    disc.classList.add('disc-up');
    disc.classList.add(color === Color.RED ? 'red' : 'yellow');
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

  private get allowMove(): boolean {
    return this.game && this.game.isActivePlayer(this.user);

  }

  private moveIdToMove(id: number, color: Color) {
    const x = id % 10;
    const y = 5 - Math.floor(id / 10);
    return new Move(<RangeX>x, <RangeY>y, color);
  }

  private moveToMoveId(move: Move): string {
    return (((5 - move.y) * 10) + move.x).toString();
  }

}
