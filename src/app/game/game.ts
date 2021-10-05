import { State, GameNode, Color, Agent } from './engine';
import { Move } from './engine/src/move';
import { GameContext } from './game.context';
import { Bot, User } from '../util/models';

export class Game {
    private node: GameNode;
    private agent = new Agent();
    readonly context: GameContext;
    readonly startDate = new Date();
    readonly moves: Move[];
    readonly isAgainstAi: boolean;

    constructor(ctx: GameContext) {
        this.context = ctx;
        this.moves = ctx.moves;
        this.node = GameNode.rootNode(ctx.initialState);
        if (ctx.moves.length > 0) {
            for (const move of this.moves) {
                this.node = this.node.childNode(move);
            }
        }
        this.isAgainstAi = this.isPlayer(Bot);
    }

    get id() {
        return this.context.id;
    }

    get isAgentTurn() {
        return this.isAgainstAi &&
            this.state === State.RED_MOVES && this.players.red.id === Bot.id ||
            this.state === State.YELLOW_MOVES && this.players.yellow.id === Bot.id;
    }

    get state(): State {
        return this.node.state;
    }

    get players() {
        return this.context.players;
    }

    get winner() {
        if (this.state === State.RED_WINS) {
            return this.players.red;
        } else if (this.state === State.YELLOW_WINS) {
            return this.players.yellow;
        }
    }

    get looser() {
        if (this.state === State.RED_WINS) {
            return this.players.yellow;
        } else if (this.state === State.YELLOW_WINS) {
            return this.players.red;
        }
    }

    get lastMove(): Move {
        return this.node.move;
    }

    get status() {
        const firstName = (str: string) => str.replace(/ .*/, '');
        switch (this.node.state) {
            case State.RED_MOVES:
                return `Waiting on ${firstName(this.players.red.name)}...`;
            case State.YELLOW_MOVES:
                return `Waiting on ${firstName(this.players.yellow.name)}...`;
            case State.RED_WINS:
                return 'Red wins.';
            case State.YELLOW_WINS:
                return 'Yellow wins.';
            case State.DRAW:
                return `Game draw.`;
        }
    }

    update(move: Move) {
        this.moves.push(move);
        this.node = this.node.childNode(move);
    }

    getAgentMove(): Move {
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

    isGameOver(): boolean {
        switch (this.state) {
            case State.RED_WINS:
            case State.YELLOW_WINS:
            case State.DRAW:
                return true;
            default: return false;
        }
    }

    private get currentTurnColor() {
        if (this.state === State.RED_MOVES) {
            return Color.RED;
        } else if (this.state === State.YELLOW_MOVES) {
            return Color.YELLOW;
        }
    }

}

