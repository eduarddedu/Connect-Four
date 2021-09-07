import { User } from '../util/models';
import { State, Move } from '../game/engine';
export interface GameContext {
    startDate: Date;
    players: {
        red: User;
        yellow: User;
    };
    moves: Move[];
    winner: User;
    state: State;
    initialState: State.RED_MOVES | State.YELLOW_MOVES;
}
