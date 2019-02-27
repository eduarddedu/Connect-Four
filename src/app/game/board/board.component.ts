import { Component, OnInit, Input, Output, AfterViewInit, ChangeDetectorRef, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, AfterViewInit {
  @Input() players: any;
  @Input() activePlayer: any;
  @Input() player: any;
  @Input() opponent: any;
  @Input() game: { state: 'in progress' | 'on hold' | 'over' };
  @Output() move: EventEmitter<string> = new EventEmitter();
  @Output() newGame: EventEmitter<any> = new EventEmitter();
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  isEmpty = true;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.addEventListener('touchstart', this.onTouchstart.bind(this)));
    inputs.forEach((input: any) => input.addEventListener('touchend', this.onTouchend.bind(this)));
  }

  onMouseoverInput(id: string, row: number) {
    if (!this.inputChecked(id) && this.ourTurn) {
      this.hoistDisc(id, row);
    }
  }

  onMouseleaveInput(id: string) {
    if (!this.inputChecked(id) && this.ourTurn) {
      this.hideDisc(id);
    }
  }

  onClickInput(event: any) {
    if (this.ourTurn) {
      this.move.emit(event.target.name);
      this.dropDisc(event.target.name);
    } else {
      event.preventDefault();
    }
  }

  onTouchstart(event: any) {
    if (!this.inputChecked(event.target.name) && this.ourTurn) {
      const id = event.target.name;
      const row = Math.floor(+id / 10);
      this.hoistDisc(id, row);
    }
  }

  onTouchend(event: any) {
    if (!this.inputChecked(event.target.name) && this.ourTurn) {
      const id = event.target.name;
      this.dropDisc(id);
    }
  }

  private hoistDisc(id: string, row: number) {
    const disc: any = document.getElementById(id);
    disc.style.color = this.activePlayer.color;
    const pixels = 15 + row * 60;
    disc.style.top = `-${pixels}px`;
    disc.style.opacity = 1;
    disc.style.transition = 'opacity 0.2s, top 0s';
  }

  private dropDisc(id: string) {
    const disc: any = document.getElementById(id);
    const seconds = 0.14 + 0.03 * Math.floor(+id / 10);
    disc.style.transition = `top ${seconds}s cubic-bezier(0.56, 0, 1, 1)`;
    disc.style.top = 0;
  }

  private hideDisc(id: string) {
    const disc: any = document.getElementById(id);
    disc.style.opacity = 0;
  }

  private get ourTurn() {
    return this.activePlayer === this.player && this.game.state === 'in progress';
  }

  replayMove(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    if (!input.checked) {
      input.checked = true;
      const row = Math.floor(+id / 10);
      this.hoistDisc(id, row);
      setTimeout(() => {
        this.dropDisc(id);
      }, 100);
    }
  }

  replayGame(moves: string[]) {
    for (let i = 0; i < moves.length; i++) {
      const id = moves[i];
      const input = <any>document.querySelector(`input[name="${id}"]`);
      input.checked = true;
      const disc: any = document.getElementById(id);
      disc.style.color = i % 2 === 0 ? this.players.red.color : this.players.yellow.color;
      disc.style.opacity = 1;
    }
  }

  onClickNewGame() {
    this.resetBoard();
    this.newGame.emit();
  }

  private resetBoard() {
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
    const discs = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach((disc: any) => {
      disc.style.top = 0;
      disc.style.opacity = 0;
    });
    this.isEmpty = true;
  }

  private inputChecked(inputName: string) {
    return (<any>document.querySelector(`input[name="${inputName}"]`)).checked;
  }

}
