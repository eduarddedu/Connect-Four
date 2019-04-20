import { User } from '../auth.service';
import { AI } from './ai';

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
    isAgainstAI: boolean;
}

export class Game implements Game {
    private ai: AI;
    constructor(data: any) {
        this.id = data.id;
        this.startDate = new Date(data.createdOn);
        this.players = data.players;
        this.state = data.state;
        this.moves = data.moves || [];
        this.points = data.points;
        this.winner = data.winner;
        this.redMovesFirst = data.redMovesFirst || true;
        this.ai = new AI(this.redMovesFirst, data.moves || []);
        this.isAgainstAI = this.players.red.id === '0' || this.players.yellow.id === '0';
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
        this.ai.update(id);
        this.checkGame();
    }

    nextBestMove() {
        return this.ai.nextBestMove();
    }

    randomMove() {
        return this.ai.randomMove();
    }

    reset() {
        this.moves = [];
        this.redMovesFirst = this.players.yellow.id === '0' ? true : !(this.winner.id === this.players.red.id);
        this.ai = new AI(this.redMovesFirst, []);
    }

    private checkGame() {
        if (this.ai.gameover()) {
            this.winner = this.inactivePlayer;
            if (this.winner.id === this.players.red.id) {
                this.points.red += 1;
            } else {
                this.points.yellow += 1;
            }
            this.state = 'over';
        }
    }
}
