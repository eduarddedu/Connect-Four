import { User } from '../auth.service';

export interface Game {
    id: string;
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    state: 'in progress' | 'over' | 'reset';
    moves: string[];
    points: {
        red: number;
        yellow: number;
    };
    redMovesFirst: boolean;
    activePlayer: User;
    activeColor: 'red' | 'yellow';
    player?: User;
    opponent?: User;
    winner?: User;
}

export class Game implements Game {
    constructor(data: any, user: User) {
        this.id = data.id;
        this.startDate = new Date(data.createdOn);
        this.players = data.players;
        this.state = data.state;
        this.moves = data.moves;
        this.points = data.points;
        this.redMovesFirst = data.redMovesFirst;
        this.activePlayer = data.redMovesFirst ? data.players.red : data.players.yellow;
        this.activeColor = data.redMovesFirst ? 'red' : 'yellow';
        const players = [data.players.red, data.players.yellow];
        if (players.map((u: User) => u.id).includes(user.id)) {
            this.player = players.find((u: User) => u.id === user.id);
            this.opponent = players.find((u: User) => u.id !== user.id);
        }
        this.winner = data.winner;
    }

    toggleActivePlayer(indexNextMove: number) {
        this.activePlayer = indexNextMove % 2 === 0 ?
            this.redMovesFirst ? this.players.red : this.players.yellow :
            this.redMovesFirst ? this.players.yellow : this.players.red;
        this.activeColor = this.activePlayer === this.players.red ? 'red' : 'yellow';
    }

    gameOver() { ////////////////// 7
        return this.moves.length >= 1 && this.moves[this.moves.length - 1] === '62';
    }
}
