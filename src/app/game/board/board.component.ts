import { Component, OnInit, Input, Output, AfterViewInit, EventEmitter, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, AfterViewInit {
  @Input() players: any;
  @Input() player: any;
  @Input() opponent: any;
  @Output() move: EventEmitter<string> = new EventEmitter();
  @Output() newGame: EventEmitter<any> = new EventEmitter();
  game: { state: string, moves: string[], winner?: any } = { state: 'in progress', moves: [] };
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  waitingForOpponent = false;
  activePlayer: any;
  redMovesFirst = true;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.activePlayer = this.players.red;
  }

  ngAfterViewInit() {
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.addEventListener('touchstart', this.onTouchstart.bind(this)));
    inputs.forEach((input: any) => input.addEventListener('touchend', this.onTouchend.bind(this)));
  }

  onMouseoverInput(id: string, row: number) {
    if (!this.input(id).checked && this.ourTurn) {
      this.hoistDisc(id, row);
    }
  }

  onMouseleaveInput(id: string) {
    if (!this.input(id).checked && this.ourTurn) {
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
    if (!this.input(event.target.name).checked && this.ourTurn) {
      const id = event.target.name;
      const row = Math.floor(+id / 10);
      this.hoistDisc(id, row);
    }
  }

  onTouchend(event: any) {
    if (!this.input(event.target.name).checked && this.ourTurn) {
      const id = event.target.name;
      this.dropDisc(id);
    }
  }

  replayLastMove() {
    const id = this.game.moves[this.game.moves.length - 1];
    const input: any = this.input(id);
    if (!input.checked) {
      input.checked = true;
      const row = Math.floor(+id / 10);
      this.hoistDisc(id, row);
      setTimeout(() => {
        this.dropDisc(id);
      }, 100);
    }
    this.setActivePlayer(this.game.moves.length);
  }

  replayGame() {
    this.setActivePlayer(0);
    for (let i = 0; i < this.game.moves.length; i++) {
      const id = this.game.moves[i];
      const input: any = this.input(id);
      input.checked = true;
      const disc: any = document.getElementById(id);
      disc.style.color = this.activePlayer.color;
      disc.style.opacity = 1;
      this.setActivePlayer(i + 1);
    }
  }

  onClickNewGame() {
    this.resetBoard();
    this.waitingForOpponent = true;
    this.newGame.emit();
  }

  setActivePlayer(indexNextMove: number) {
    this.activePlayer = indexNextMove % 2 === 0 ?
      this.redMovesFirst ? this.players.red : this.players.yellow :
      this.redMovesFirst ? this.players.yellow : this.players.red;
    this.cdr.detectChanges();
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

  private resetBoard() {
    const discs = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach((disc: any) => {
      disc.style.top = 0;
      disc.style.opacity = 0;
    });
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
  }

  private input(name: string): any {
    return document.querySelector(`input[name="${name}"]`);
  }

}
