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
    _redWins: boolean;
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
        this.redMovesFirst = data.redMovesFirst;
        this.winner = data.winner;
    }

    get activeColor() {
        return this.activePlayer === this.players.red ? 'red' : 'yellow';
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

    get gameOver() {
        return this.state === 'over';
    }

    update(moves: string[]) {
        this.moves = moves;
        if (this.isVictory()) {
            this.winner = this.inactivePlayer;
            this._redWins = this.winner.id === this.players.red.id;
            if (this._redWins) {
                this.points.red += 1;
            } else {
                this.points.yellow += 1;
            }
            this.state = 'over';
        }
    }

    private isVictory() {
        let isVictory: boolean;
        /////////////////////////// 7
        isVictory = this.moves.length >= 1 && this.moves[this.moves.length - 1] === '62';
        return isVictory;
    }

    reset() {
        this.moves = [];
        this.redMovesFirst = !this._redWins;
    }
}
