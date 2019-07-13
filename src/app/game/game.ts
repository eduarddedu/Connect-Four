/**
 * The Game class contains the game as a whole and
 * performs all of the dynamic computations which determine the game state as seen by both players and watchers.
 * The more complicated methods are delegated to the GameModel helper class.
 */

import { User } from '../util/models';
import { GameModel } from './model';

export class Game {
    private model: GameModel;
    private user: User;
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
    ourUserPlays: boolean;
    isAgainstAi: boolean;
    opponent: User;
    status = '';

    constructor(data: any, user: User) {
        this.user = user;
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
        const aiPlaysRed = this.players.red.id === '0';
        this.model = new GameModel(this.redMovesFirst, data.moves, aiPlaysRed);
        this.updateStatus();
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

    get isOurTurn() {
        return this.ourUserPlays && this.state === 'in progress' && this.activePlayer.id === this.user.id;
    }

    update(moveId: string) {
        this.moves.push(+moveId);
        this.model.move(+moveId);
        this.checkGame();
    }

    reset() {
        const data = {
            moves: [],
            state: 'in progress',
            redMovesFirst: this.winner ? this.winner.id === this.players.yellow.id : true,
            winner: undefined
        };
        Object.assign(this, data);
        this.updateStatus();
        const aiPlaysRed = this.players.red.id === '0';
        this.model = new GameModel(this.redMovesFirst, this.moves, aiPlaysRed);
    }

    updateStatus() {
        const firstName = (str: string) => str.replace(/ .*/, '');
        switch (this.state) {
            case 'over':
                this.status = `Game over`;
                break;
            case 'in progress':
                if (this.ourUserPlays) {
                    this.status = this.isOurTurn ? 'Your turn' : `Waiting on ${firstName(this.activePlayer.name)}...`;
                } else {
                    this.status = `Waiting on ${firstName(this.activePlayer.name)}...`;
                }
                break;
            case 'on hold':
                this.status = 'Waiting on second player...';

        }
    }

    nextBestMove() {
        return this.model.nextBestMove();
    }

    randomMove() {
        return this.model.randomMove();
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
        this.updateStatus();
    }

}

