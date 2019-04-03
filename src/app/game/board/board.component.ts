import { Component, Input, Output, AfterViewInit, EventEmitter } from '@angular/core';



@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements AfterViewInit {
  @Input() activeColor: string;
  @Input() isOurTurn: boolean;
  @Output() move: EventEmitter<string> = new EventEmitter();
  private RED = '#ff010b';
  private YELLOW = '#ffd918';
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];

  ngAfterViewInit() {
    /* Bind event handlers for board interaction on mobile devices */
    const inputs: any[] = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach(input => input.addEventListener('touchstart', this.onTouchstart.bind(this)));
    inputs.forEach(input => input.addEventListener('touchend', this.onTouchend.bind(this)));
  }

  onMouseoverInput(id: string) {
    if (!this.input(id).checked && this.isOurTurn) {
      this.hoistDisc(id);
    }
  }

  onMouseleaveInput(id: string) {
    if (!this.input(id).checked && this.isOurTurn) {
      this.hideDisc(id);
    }
  }

  onClickInput(event: any) {
    if (this.isOurTurn) {
      this.move.emit(event.target.name);
      this.dropDisc(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  onTouchstart(event: any) {
    const id = event.target.name;
    if (!this.input(id).checked && this.isOurTurn) {
      this.hoistDisc(id);
    }
  }

  onTouchend(event: any) {
    const id = event.target.name;
    if (!this.input(id).checked && this.isOurTurn) {
      this.dropDisc(id);
    }
  }

  replayMove(id: string) {
    const input = this.input(id);
    if (!input.checked) {
      input.checked = true;
      this.hoistDisc(id);
      setTimeout(() => {
        this.dropDisc(id);
      }, 100);
    }
  }

  replayGame(moves: string[], redMovesFirst: boolean) {
    let color = redMovesFirst ? this.RED : this.YELLOW;
    for (let i = 0; i < moves.length; i++) {
      const id = moves[i];
      const input = this.input(id);
      input.checked = true;
      const disc = this.disc(id);
      disc.classList.remove('initial');
      disc.classList.add('disc-down');
      disc.style.color = color;
      color = color === this.RED ? this.YELLOW : this.RED;
    }
  }

  clear() {
    const discs: any[] = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach(disc => {
      disc.classList.remove('disc-drop', 'disc-down', 'disc-up');
      disc.classList.add('disc-initial');
    });
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
  }

  private hoistDisc(id: string) {
    const disc = this.disc(id);
    disc.classList.remove('disc-initial');
    disc.classList.add('disc-up');
    disc.style.color = this.activeColor === 'red' ? this.RED : this.YELLOW;
  }

  private dropDisc(id: string) {
    const disc = this.disc(id);
    disc.classList.remove('disc-up');
    disc.classList.add('disc-drop');
  }

  private hideDisc(id: string) {
    this.disc(id).classList.remove('disc-up');
    this.disc(id).classList.add('disc-initial');
  }

  private input(name: string): any {
    return document.querySelector(`input[name="${name}"]`);
  }

  private disc(id: string): any {
    return document.getElementById(id);
  }

}
