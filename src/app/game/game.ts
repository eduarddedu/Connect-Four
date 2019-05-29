/**
 * The Game class contains the static and dynamic properties of the game,
 * including "intelligent" methods to determin win or draw or the next best move.
 * The more complicated methods delegated to the GameModel helper class.
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
    ourUserPlays: boolean;
    isAgainstAi: boolean;
    opponent: User;
}

export class Game implements Game {
    private model: GameModel;

    constructor(data: any, user: User) {
        this.id = data.id;
        this.startDate = new Date(data.startDate);
        this.players = data.players;
        this.state = data.state;
        this.points = data.points;
        this.winner = data.winner;
        this.redMovesFirst = data.redMovesFirst;
        this.moves = data.moves;
        const ids = [this.players.red, this.players.yellow].map(player => player.id);
        this.isAgainstAi = ids.includes('0');
        this.ourUserPlays = ids.includes(user.id);
        this.opponent = this.players.red.id === user.id ? this.players.yellow : this.players.red;
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

