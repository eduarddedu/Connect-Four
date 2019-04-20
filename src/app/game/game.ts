import { User } from '../auth.service';

export interface Game {
    id: string;
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    state: 'in progress' | 'over' | 'on hold';
    moves: string[];
    points: {
        red: number;
        yellow: number;
    };
    redMovesFirst: boolean;
    winner?: User;
}

export class Game implements Game {
    constructor(data: any) {
        this.id = data.id;
        this.startDate = new Date(data.createdOn);
        this.players = data.players;
        this.state = data.state;
        this.moves = data.moves;
        this.points = data.points;
        this.winner = data.winner;
        this.redMovesFirst = data.redMovesFirst || true;
    }

    get activeColor() {
        return this.activePlayer === this.players.red ? 'red' : 'yellow';
    }

    get inactiveColor() {
        return this.activeColor === 'red' ? 'yellow' : 'red';
    }

    get activePlayer() {
        const indexNextMove = this.moves.length;
        return indexNextMove % 2 === 0 ?
            this.redMovesFirst ? this.players.red : this.players.yellow
            :
            this.redMovesFirst ? this.players.yellow : this.players.red;
    }

    get inactivePlayer() {
        return this.activePlayer === this.players.red ? this.players.yellow : this.players.red;
    }

    get gameover() {
        return this.state === 'over';
    }

    move(id: string) {
        this.moves.push(id);
        this.checkGame();
    }

    reset() {
        this.moves = [];
        this.redMovesFirst = this.players.yellow.id === '0' ? true : !(this.winner.id === this.players.red.id);
    }

    private checkGame() {
        if (this._gameover()) {
            this.winner = this.inactivePlayer;
            if (this.winner.id === this.players.red.id) {
                this.points.red += 1;
            } else {
                this.points.yellow += 1;
            }
            this.state = 'over';
        }
    }

    private _gameover() {
        if (this.moves.length < 7) {
            return false;
        }
        const discInSlot = (id: number) => {
            const disc: Element = document.getElementById(`${id}`);
            return disc.classList.contains(this.inactiveColor);
        };
        function CountFour() {
            this.check = function (array: number[]): boolean {
                if (array.length < 4) {
                    return false;
                }
                let count = 0;
                for (const id of array) {
                    if (discInSlot(id)) {
                        if (++count === 4) {
                            console.log('Victory : ', array);
                            return true;
                        } else {
                            continue;
                        }
                    } else {
                        count = 0;
                    }
                }
                return false;
            };
        }
        const lastMove: number = +this.moves[this.moves.length - 1];
        const row = Math.floor(lastMove / 10), col = lastMove % 10;
        const accumulator = new CountFour();

        const checkRow = () => {
            const arr = [];
            for (let c = 1; c <= 7; c++) {
                arr.push(row * 10 + c);
            }
            return accumulator.check(arr);
        };
        const checkColumn = () => {
            const arr = [];
            for (let r = 1; r <= 6; r++) {
                arr.push(r * 10 + col);
            }
            return accumulator.check(arr);
        };
        const checkDiagonals = () => {
            const mainDiagonal = [row * 10 + col];
            let r = row, c = col;
            // walk NW
            while (--r >= 1 && --c >= 1) {
                mainDiagonal.push(r * 10 + c);
            }
            mainDiagonal.reverse();
            // walk SE
            r = row, c = col;
            while (++r <= 6 && ++c <= 7) {
                mainDiagonal.push(r * 10 + c);
            }
            const counterDiagonal = [row * 10 + col];
            r = row, c = col;
            // walk NE
            while (--r >= 1 && ++c <= 7) {
                counterDiagonal.push(r * 10 + c);
            }
            counterDiagonal.reverse();
            // walks SW
            r = row, c = col;
            while (++r <= 6 && --c >= 1) {
                counterDiagonal.push(r * 10 + c);
            }
            return accumulator.check(mainDiagonal) || accumulator.check(counterDiagonal);
        };
        return checkRow() || checkColumn() || checkDiagonals();
    }

}
