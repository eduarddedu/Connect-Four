import { Color, State, Move, GameNode, Agent } from '../index';
import { GameModel } from '../../model';

import { Game } from '../../game';

let moves: Move[];

const stats = {
    redWins: { playsFirst: 0, playsSecond: 0 },
    yellowWins: { playsFirst: 0, playsSecond: 0 },
    draws: 0
};

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
            moveId = +Game.moveToMoveId(move);
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
            move = Game.moveIdToMove(moveId, Color.YELLOW);
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










