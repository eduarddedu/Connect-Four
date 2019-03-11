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
  @Input() game: any;
  @Input() recordDestroyed: boolean;
  @Output() move: EventEmitter<string> = new EventEmitter();
  @Output() newGame: EventEmitter<any> = new EventEmitter();
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  activePlayer: any;
  redMovesFirst = true;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.activePlayer = this.players.red;
  }

  ngAfterViewInit() {
    /* Bind event handlers for mobile interaction */
    const inputs: any[] = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach(input => input.addEventListener('touchstart', this.onTouchstart.bind(this)));
    inputs.forEach(input => input.addEventListener('touchend', this.onTouchend.bind(this)));
  }

  onMouseoverInput(id: string) {
    if (!this.input(id).checked && this.ourTurn) {
      this.hoistDisc(id);
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
      this.toggleActivePlayer(this.game.moves.length);
    } else {
      event.preventDefault();
    }
  }

  onTouchstart(event: any) {
    const id = event.target.name;
    if (!this.input(id).checked && this.ourTurn) {
      this.hoistDisc(id);
    }
  }

  onTouchend(event: any) {
    const id = event.target.name;
    if (!this.input(id).checked && this.ourTurn) {
      this.dropDisc(id);
    }
  }

  replayLastMove() {
    if (this.game.moves.length !== 0) {
      const id = this.game.moves[this.game.moves.length - 1];
      const input = this.input(id);
      if (!input.checked) {
        input.checked = true;
        this.hoistDisc(id);
        setTimeout(() => {
          this.dropDisc(id);
          this.toggleActivePlayer(this.game.moves.length);
        }, 100);
      }
    }
  }

  replayGame() {
    this.toggleActivePlayer(0);
    for (let i = 0; i < this.game.moves.length; i++) {
      const id = this.game.moves[i];
      const input = this.input(id);
      input.checked = true;
      const disc = this.disc(id);
      disc.classList.remove('initial');
      disc.classList.add('disc-down');
      disc.style.color = this.activePlayer.color;
      this.toggleActivePlayer(i + 1);
    }
  }

  onClickNewGame() {
    this.newGame.emit();
  }

  toggleActivePlayer(indexNextMove: number) {
    this.activePlayer = indexNextMove % 2 === 0 ?
      this.redMovesFirst ? this.players.red : this.players.yellow :
      this.redMovesFirst ? this.players.yellow : this.players.red;
    this.cdr.detectChanges();
  }

  clearBoard() {
    const discs: any[] = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach(disc => {
      disc.classList.remove('disc-drop', 'disc-down', 'disc-up');
      disc.classList.add('disc-initial');
    });
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
  }

  showWinner() {
    return this.game.state === 'completed' ||
      (!this.player && this.game.state.startsWith('waiting for') ||
        this.player && this.game.state === `waiting for ${this.player.username}`);
  }

  showWaitingFor() {
    return this.opponent && this.game.state === `waiting for ${this.opponent.username}`;
  }

  newGameButtonVisibility(): 'visible' | 'hidden' {
    return this.player && (this.game.state === 'completed' || this.game.state === `waiting for ${this.player.username}`) ?
      'visible' : 'hidden';
  }

  private get ourTurn() {
    return this.activePlayer === this.player && this.game.state === 'in progress';
  }

  private hoistDisc(id: string) {
    const disc = this.disc(id);
    disc.classList.remove('disc-initial');
    disc.classList.add('disc-up');
    disc.style.color = this.activePlayer.color;
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
