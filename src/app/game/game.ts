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

    get isOver() {
        return this.state === 'over';
    }

    update(moves: string[]) {
        this.moves = moves;
        if (this.isVictory()) {
            this.winner = this.inactivePlayer;
            const redWins = this.winner.id === this.players.red.id;
            if (redWins) {
                this.points.red += 1;
            } else {
                this.points.yellow += 1;
            }
            this.state = 'over';
        }
    }

    private isVictory() {
        /* if (this.moves.length < 7) {
            return false;
        } */

        const lastMove: number = +this.moves[this.moves.length - 1];
        const row = Math.floor(lastMove / 10);
        const col = lastMove % 10;
        const discSet = (id: number) => {
            const disc: Element = document.getElementById(`${id}`);
            return disc.classList.contains(this.inactiveColor);
        };

        const checkRow = () => {
            let count = 0;
            for (let c = 1; c <= 7; c++) {
                const id = row * 10 + c;
                if (discSet(id)) {
                    count++;
                } else {
                    count = 0;
                }
                if (count === 4) {
                    return true;
                }
            }
            return false;
        };

        /* return checkRowToTheLeft() || checkRowToTheRight() || checkColDown(); */
        return checkRow();
    }

    newGame() {
        this.moves = [];
        this.redMovesFirst = !(this.winner.id === this.players.red.id);
    }
}
