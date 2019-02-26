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
  @Input() opponent: string;
  @Input() gameRecord: any;
  @Input() client: any;
  activePlayer: any;
  rows = [1, 2, 3, 4, 5, 6];
  columns = [1, 2, 3, 4, 5, 6, 7];
  game = { state: 'in progress' };
  boardEmpty = true;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.activePlayer = this.red;
  }

  ngAfterViewInit() {
    this.gameRecord.subscribe('moves', this.onMovesUpdate.bind(this), true);
    this.gameRecord.subscribe('game', this.onGameUpdate.bind(this), true);
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
      this.dropDisc(event.target.name);
      this.updateGame(event.target.name);
      this.updateMoves(event.target.name);
      this.toggleActivePlayer();
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
    return this.activePlayer.username === this.username && this.game.state === 'in progress';
  }

  private renderOpponentMove(id: string) {
    const input = <any>document.querySelector(`input[name="${id}"]`);
    if (!input.checked) {
      input.checked = true;
      const row = Math.floor(+id / 10);
      this.hoistDisc(id, row);
      setTimeout(() => {
        this.dropDisc(id);
        this.toggleActivePlayer();
      }, 100);
    }
  }

  private replayGame(moves: string[]) {
    for (let i = 0; i < moves.length; i++) {
      const id = moves[i];
      const input = <any>document.querySelector(`input[name="${id}"]`);
      input.checked = true;
      const disc: any = document.getElementById(id);
      disc.style.color = this.activePlayer.color;
      disc.style.opacity = 1;
      this.toggleActivePlayer();
    }
  }

  private updateMoves(id: string) {
    const moves = this.gameRecord.get('moves');
    moves.push(id);
    this.gameRecord.set('moves', moves);
  }

  private onMovesUpdate(moves: string[]) {
    if (moves && moves.length > 0) {
      if (this.boardEmpty && moves.length > 1) {
        this.replayGame(moves);
      } else {
        const id = moves[moves.length - 1];
        this.renderOpponentMove(id);
      }
      this.boardEmpty = false;
    }
  }

  onClickNewGame() {
    this.resetBoard();
    if (this.game.state === 'on hold') {
      this.gameRecord.set('moves', []);
      this.activePlayer = this.username === this.red.username ? this.red : this.yellow;
      this.gameRecord.set('game.state', 'in progress');
    } else {
      this.gameRecord.set('game.state', 'on hold');
      this.activePlayer = this.opponent === this.red.username ? this.red : this.yellow;
    }
  }

  private onGameUpdate(game: any) {
    if (game) {
      this.game = game;
    }
  }

  private updateGame(id: string) {
    if (this.gameover(id)) {
      this.activePlayer.points = this.activePlayer.points + 1;
      this.gameRecord.set('players', { red: this.red, yellow: this.yellow });
      this.gameRecord.set('game', { state: 'over', winner: this.activePlayer });
    }
  }

  private resetBoard() {
    const inputs = [].slice.call(document.querySelectorAll('input'));
    inputs.forEach((input: any) => input.checked = false);
    const discs = [].slice.call(document.querySelectorAll('div.disc'));
    discs.forEach((disc: any) => {
      disc.style.top = 0;
      disc.style.opacity = 0;
    });
    this.boardEmpty = true;
  }

  private toggleActivePlayer() {
    this.activePlayer = this.activePlayer === this.red ? this.yellow : this.red;
    this.cdr.detectChanges();
  }

  private inputChecked(inputName: string) {
    return (<any>document.querySelector(`input[name="${inputName}"]`)).checked;
  }

  private gameover(id: string) {
    return id === '62';
  }

}
