import { User } from '../util/models';
import { State, Move } from './engine';
export class GameContext {
    readonly id: string;
    readonly initialState: State.RED_MOVES | State.YELLOW_MOVES;
    readonly players: {
        red: User
        yellow: User;
    } = { red: null, yellow: null };
    readonly moves: Move[] = [];

    constructor(id: string, red: User, yellow: User, initialState: State.RED_MOVES | State.YELLOW_MOVES) {
        this.id = id;
        this.initialState = initialState;
        this.players.red = red;
        this.players.yellow = yellow;
    }
}
