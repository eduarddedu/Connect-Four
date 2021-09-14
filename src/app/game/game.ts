import { State, GameNode, Color, Agent } from './engine';
import { Move } from './engine/src/move';
import { GameContext } from './gameContext';
import { User } from '../util/models';

export class Game {
    private node: GameNode;
    private agent = new Agent();
    private _lastMove: Move;
    readonly context: GameContext;
    readonly startDate = new Date();
    readonly moves: Move[];
    readonly isAgainstAi: boolean;
    status = '';

    constructor(ctx: GameContext) {
        this.context = ctx;
        this.moves = ctx.moves;
        this.node = GameNode.rootNode(ctx.initialState);
        this.isAgainstAi = [this.players.red.id, this.players.yellow.id].includes('0');
        this.setStatus();
    }

    get id() {
        return this.context.id;
    }

    get isAgentTurn() {
        return this.isAgainstAi &&
            this.state === State.RED_MOVES && this.players.red.id === '0' ||
            this.state === State.YELLOW_MOVES && this.players.yellow.id === '0';
    }

    get state(): State {
        return this.node.state;
    }

    get players() {
        return Object.assign({}, this.context.players);
    }

    get winner() {
        if (this.state === State.RED_WINS) {
            return this.players.red;
        } else if (this.state === State.YELLOW_WINS) {
            return this.players.yellow;
        }
    }

    get lastMove(): Move {
        return Object.assign({}, this._lastMove);
    }

    computeAgentMove(): Move {
        return this.agent.move(this.node);
    }

    isPlayer(user: User) {
        return Object.keys(this.players).map(k => this.players[k].id).includes(user.id);
    }

    getPlayerColor(user: User): Color {
        if (this.isPlayer(user)) {
            return this.players.red.id === user.id ? Color.RED : Color.YELLOW;
        }
    }

    isActivePlayer(user: User) {
        const color = this.getPlayerColor(user);
        return color !== undefined && color === this.currentTurnColor;
    }

    opponent(user: User): User {
        if (this.isPlayer(user)) {
            return this.players.red.id === user.id ? this.players.yellow : this.players.red;
        }
    }

    update(move: Move) {
        this.moves.push(move);
        this._lastMove = move;
        this.node = this.node.childNode(move);
        this.setStatus();
    }

    private get currentTurnColor() {
        if (this.state === State.RED_MOVES) {
            return Color.RED;
        } else if (this.state === State.YELLOW_MOVES) {
            return Color.YELLOW;
        }
    }

    private setStatus() {
        const firstName = (str: string) => str.replace(/ .*/, '');
        switch (this.node.state) {
            case State.RED_WINS:
            case State.YELLOW_WINS:
            case State.DRAW:
                this.status = `Game over`;
                break;
            case State.RED_MOVES:
                this.status = `Waiting on ${firstName(this.context.players.red.name)}...`;
                break;
            case State.YELLOW_MOVES:
                this.status = `Waiting on ${firstName(this.context.players.yellow.name)}...`;

        }
    }

}

