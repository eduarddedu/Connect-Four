/**
 * Contains locally stored game data.
 * Provides access to properties of the game which are the same for all users.
 * Delegates the difficult tasks such as calculating the next best move, to the GameModel class.
 */

import { User } from '../auth.service';
import { GameModel } from './game-model';

export interface Game {
    id: string;
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    state: 'in progress' | 'over' | 'on hold';
    points: {
        red: number;
        yellow: number;
    };
    moves: number[];
    redMovesFirst: boolean;
    winner?: User;
    isAgainstAi: boolean;
}

export class Game implements Game {
    private model: GameModel;
    constructor(data: any) {
        this.id = data.id;
        this.startDate = new Date(data.createdOn);
        this.players = data.players;
        this.state = data.state;
        this.points = data.points;
        this.winner = data.winner;
        this.redMovesFirst = data.redMovesFirst || true;
        this.moves = data.moves || [];
        this.isAgainstAi = this.players.red.id === '0' || this.players.yellow.id === '0';
        this.model = new GameModel(this.redMovesFirst, data.moves || []);
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

    get gameover() {
        return this.state === 'over';
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

