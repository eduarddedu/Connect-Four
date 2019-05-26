/**
 * The Game class contains the whole game state. The methods to determine
 * win/draw or the next best move for a player are delegated to the GameModel helper class.
 */

import { User } from '../util/user';
import { GameModel } from './game-model';

export interface Game {
    id: string;
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    state: 'in progress' | 'over';
    points: {
        red: number;
        yellow: number;
    };
    moves: number[];
    redMovesFirst: boolean;
    winner?: User;
    isAgainstAI: boolean;
}

export class Game implements Game {
    private model: GameModel;

    constructor(data: any) {
        this.id = data.id;
        this.startDate = new Date(data.startDate);
        this.players = data.players;
        this.state = data.state;
        this.points = data.points;
        this.winner = data.winner;
        this.redMovesFirst = data.redMovesFirst;
        this.moves = data.moves;
        this.isAgainstAI = this.players.red.id === '0' || this.players.yellow.id === '0';
        this.model = new GameModel(this.redMovesFirst, data.moves);
    }

    get activeColor() {
        return this.activePlayer === this.players.red ? 'red' : 'yellow';
    }

    get inactiveColor() {
        return this.activeColor === 'red' ? 'yellow' : 'red';
    }

    get activePlayer() {
        return this.moves.length % 2 === 0 ?
            this.redMovesFirst ? this.players.red : this.players.yellow
            :
            this.redMovesFirst ? this.players.yellow : this.players.red;
    }

    get inactivePlayer() {
        return this.activePlayer === this.players.red ? this.players.yellow : this.players.red;
    }

    update(id: string) {
        this.moves.push(+id);
        this.model.move(+id);
        this.checkGame();
    }

    nextBestMove() {
        return this.model.nextBestMove();
    }

    randomMove() {
        return this.model.randomMove();
    }

    reset() {
        if (this.winner) {
            this.redMovesFirst = this.winner.id === this.players.yellow.id;
        }
        this.moves = [];
        this.state = 'in progress';
        this.model = new GameModel(this.redMovesFirst, []);
    }

    private checkGame() {
        if (this.model.win || this.model.draw) {
            this.state = 'over';
        }
        if (this.model.win) {
            this.winner = this.inactivePlayer;
            if (this.winner.id === this.players.red.id) {
                this.points.red += 1;
            } else {
                this.points.yellow += 1;
            }
        }
    }
}

