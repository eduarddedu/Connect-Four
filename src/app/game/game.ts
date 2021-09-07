/**
 * The Game class contains the game as a whole and
 * performs all of the dynamic computations which determine the game state as seen by both players and watchers.
 * The more complicated methods are delegated to the GameModel helper class.
 */

import { Agent, State, Color, GameNode, RangeX, RangeY } from './engine';
import { User } from '../util/models';
import { Move } from './engine/src/move';

export class Game {
    private agent: Agent = new Agent();
    private gameNode: GameNode;
    private user: User;
    id: string;
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    state: 'in progress' | 'over' | 'on hold';
    initialGameState: State.RED_MOVES | State.YELLOW_MOVES;
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

    public static moveIdToMove(moveId: number, color: Color) {
        const x = (moveId % 10) - 1;
        const y = Math.abs(Math.floor(moveId / 10) - 6);
        return new Move(<RangeX>x, <RangeY>y, color);
    }

    public static moveToMoveId(move: Move) {
        const _x = move.x + 1;
        const _y = Math.abs(move.y - 6) * 10;
        const moveId = _x + _y;
        return moveId.toString();
    }

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
        this.initialGameState = this.redMovesFirst ? State.RED_MOVES : State.YELLOW_MOVES;
        this.gameNode = GameNode.rootNode(this.initialGameState);
        this.updateStatus();
    }

    get activeColor() {
        return this.activePlayer === this.players.red ? Color.RED : Color.YELLOW;
    }

    get inactiveColor() {
        return this.activeColor === Color.RED ? Color.YELLOW : Color.RED;
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
        const color = this.inactiveColor;
        const move = Game.moveIdToMove(+moveId, color);
        this.gameNode = this.gameNode.childNode(move);
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
        this.gameNode = GameNode.rootNode(this.initialGameState);
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
        return Game.moveToMoveId(this.agent.move(this.gameNode));
    }

    private checkGame() {
        if (this.gameNode.state === State.RED_WINS || this.gameNode.state === State.YELLOW_WINS || this.gameNode.state === State.DRAW) {
            this.state = 'over';
        }
        if (this.gameNode.state === State.RED_WINS || this.gameNode.state === State.YELLOW_WINS) {
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

