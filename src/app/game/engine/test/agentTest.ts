import { RangeX, RangeY, Color, State, Move, GameNode, Agent } from '../index';
import { GameModel } from '../../model';

let moves: Move[];

const stats = {
    redWins: { playsFirst: 0, playsSecond: 0 },
    yellowWins: { playsFirst: 0, playsSecond: 0 },
    draws: 0
};

function moveIdToMove(moveId: number, color: Color) {
    const x = (moveId % 10) - 1;
    const y = Math.abs(Math.floor(moveId / 10) - 6);
    return new Move(<RangeX>x, <RangeY>y, color);
}

function moveToMoveId(move: Move) {
    const _x = move.x + 1;
    const _y = Math.abs(move.y - 6) * 10;
    const moveId = _x + _y;
    return moveId.toString();
}

function assertModelInTerminalState(model: GameModel) {
    if (!(model.win || model.draw)) {
        throw new Error('ModelBasedAgent is not in game over');
    }
}

function isTerminalNode(_node: GameNode) {
    switch (_node.state) {
        case State.RED_WINS:
        case State.YELLOW_WINS:
        case State.DRAW:
            return true;
        default:
            return false;
    }
}

function playModelBasedVsStatelessAgentGame(redMovesFirst: boolean): State {
    moves = [];
    const sAgent: Agent = new Agent(); // always plays red
    const mAgent = new GameModel(redMovesFirst, [], false); // always plays yellow
    const initialState = redMovesFirst ? State.RED_MOVES : State.YELLOW_MOVES;
    let node = GameNode.rootNode(initialState);
    let moveId: number;
    let move: Move;
    function redMove() {
        try {
            move = sAgent.move(node);
            moves.push(move);
            node = node.childNode(move);
            moveId = +moveToMoveId(move);
            mAgent.move(moveId);
        } catch (e) {
            console.log(moves);
            throw e;
        }
    }
    function yellowMove() {
        try {
            moveId = mAgent.nextBestMove();
            mAgent.move(moveId);
            move = moveIdToMove(moveId, Color.YELLOW);
            moves.push(move);
            node = node.childNode(move);
        } catch (e) {
            console.log(moves);
            throw e;
        }
    }
    if (redMovesFirst) {
        while (true) {
            redMove();
            if (isTerminalNode(node)) {
                assertModelInTerminalState(mAgent);
                return node.state;
            }
            yellowMove();
            if (isTerminalNode(node)) {
                assertModelInTerminalState(mAgent);
                return node.state;
            }
        }
    } else {
        while (true) {
            yellowMove();
            if (isTerminalNode(node)) {
                assertModelInTerminalState(mAgent);
                return node.state;
            }
            redMove();
            if (isTerminalNode(node)) {
                assertModelInTerminalState(mAgent);
                return node.state;
            }
        }
    }
}

function createStatistic() {
    const numGames = 20;
    console.log('Running ' + numGames + ' games. This may take a while...');
    for (let i = 0; i < numGames; i++) {
        const redMovesFirst = i % 2 === 0;
        const state: State = playModelBasedVsStatelessAgentGame(redMovesFirst);
        switch (state) {
            case State.RED_WINS:
                if (redMovesFirst) {
                    stats.redWins.playsFirst++;
                } else {
                    stats.redWins.playsSecond++;
                }
                break;
            case State.YELLOW_WINS:
                if (redMovesFirst) {
                    stats.yellowWins.playsSecond++;
                } else {
                    stats.yellowWins.playsFirst++;
                }
                break;

            case State.DRAW:
                stats.draws++;
        }
    }
    console.log(stats);
}

createStatistic();

function assessAgentMove() {
    let node = GameNode.rootNode(State.RED_MOVES);
    const _moves = [
        new Move(0, 0, 0),
        new Move(3, 0, 1),
        new Move(0, 1, 0),
        new Move(4, 0, 1),
        new Move(1, 0, 0),
        new Move(5, 0, 1),
        new Move(1, 1, 0)
    ];
    for (const move of _moves) {
        node = node.childNode(move);
    }
    const agent = new Agent();
    console.log(agent.move(node));
}

// assessAgentMove();










