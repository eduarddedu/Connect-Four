import { Color } from './types';
import { Move } from './move';
import { GameTree } from './gametree';
import { GameNode, State } from './gamenode';

export class Agent {
    private node: GameNode;
    private readonly SEARCH_TREE_DEPTH = 5;
    private color: Color;

    /**
     * @param node a non-terminal game state
     * @returns the move the agent chooses to play
     */
    public move(node: GameNode): Move {
        this.init(node);
        return this.calculateMove();
    }

    private init(node: GameNode) {
        switch (node.state) {
            case State.RED_MOVES: this.color = Color.RED;
                break;
            case State.YELLOW_MOVES: this.color = Color.YELLOW;
                break;
            default: throw new Error('Agent cannot move: game over');
        }
        this.node = node;
    }

    private calculateMove(): Move {
        const options = this.principalVariation();
        return this.pickRandomMaxScoreMove(options);
    }

    /**
     * @returns a score value for each of the next possible moves
     */
    private principalVariation(): Array<{ score: number, move: Move }> {
        const moves = [];
        const tree = new GameTree(this.node, this.SEARCH_TREE_DEPTH);
        for (const child of tree.root.children) {
            const value = this.minimax(child, false, -Infinity, Infinity);
            moves.push({ score: value, move: child.move });
        }
        return moves.sort((a: any, b: any) => a.score - b.score);
    }

    private minimax(node: GameNode, maximizingPlayer: boolean, alpha: number, beta: number) {
        if (node.children.length === 0) {
            return this.evaluateNode(node);
        }
        if (maximizingPlayer) {
            for (const child of node.children) {
                alpha = Math.max(alpha, this.minimax(child, false, alpha, beta));
                if (alpha >= beta) {
                    return alpha;
                }
            }
            return alpha;
        } else {
            for (const child of node.children) {
                beta = Math.min(beta, this.minimax(child, true, alpha, beta));
                if (beta <= alpha) {
                    return beta;
                }
            }
            return beta;
        }
    }

    private evaluateNode(node: GameNode): number {
        switch (node.state) {
            case State.RED_WINS:
            case State.YELLOW_WINS:
                return this.agentWins(node) ? Infinity : -Infinity;
            case State.DRAW:
                return 0;
            default:
                return this.getHeuristicValue(node);
        }
    }

    private agentWins(node: GameNode) {
        return node.state === State.RED_WINS && this.color === Color.RED ||
            node.state === State.YELLOW_WINS && this.color === Color.YELLOW;
    }


    private getHeuristicValue(node: GameNode) {
        const board = node.board;
        const redStrength = this.evaluatePositionStrength(Color.RED, board);
        const yellowStrength = this.evaluatePositionStrength(Color.YELLOW, board);
        return redStrength + yellowStrength;
    }

    private evaluatePositionStrength(color: Color, board: Color[][]): number {
        let score = 0;
        let foundGroup3 = false;
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 7; x++) {
                for (const v of [Vector.NW, Vector.N, Vector.NE, Vector.E]) {
                    const valence = this.groupValence(x, y, v, board, color);
                    if (valence) {
                        if (valence.numColoredCells === 3 && valence.numMovesUntilComplete === 1) {
                            if (foundGroup3) {
                                const highScore = Math.pow(10, 9);
                                return color === this.color ? highScore : -highScore;
                            } else {
                                foundGroup3 = true;
                            }
                        }
                        score += this.groupValue(valence);
                    }
                }
            }
        }
        return color === this.color ? score : -score;
    }

    private groupValence(x: number, y: number, v: Vector, grid: Color[][], color: Color): GroupValence {
        const valence: GroupValence = { numColoredCells: 0, numMovesUntilComplete: 0 };
        const opponentColor = color === Color.RED ? Color.YELLOW : Color.RED;
        switch (v) {
            case Vector.NW:
                if (x >= 3 && y <= 2) {
                    for (let i = 0; i <= 3; i++) {
                        const cellColor = grid[x - i][y + i];
                        if (cellColor === opponentColor) {
                            return null;
                        } else if (cellColor === color) {
                            valence.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[x][k] === undefined) {
                                valence.numMovesUntilComplete++;
                            }
                        }
                    }
                    return valence;
                } else {
                    return null;
                }
            case Vector.NE:
                if (x <= 3 && y <= 2) {
                    for (let i = 0; i <= 3; i++) {
                        const cellColor = grid[x + i][y + i];
                        if (cellColor === opponentColor) {
                            return null;
                        } else if (cellColor === color) {
                            valence.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[x][k] === undefined) {
                                valence.numMovesUntilComplete++;
                            }
                        }
                    }
                    return valence;
                } else {
                    return null;
                }
            case Vector.N:
                if (y <= 2) {
                    for (let _y = y; _y <= y + 3; _y++) {
                        const cellColor = grid[x][_y];
                        if (cellColor === opponentColor) {
                            return null;
                        } else if (cellColor === color) {
                            valence.numColoredCells++;
                        } else {
                            valence.numMovesUntilComplete++;
                        }
                    }
                    return valence;
                } else {
                    return null;
                }
            case Vector.E:
                if (x <= 3) {
                    for (let _x = x; _x <= x + 3; _x++) {
                        const cellColor = grid[_x][y];
                        if (cellColor === opponentColor) {
                            return null;
                        } else if (cellColor === color) {
                            valence.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[_x][k] === undefined) {
                                valence.numMovesUntilComplete++;
                            }
                        }
                    }
                    return valence;
                } else {
                    return null;
                }
        }
    }

    private groupValue(val: GroupValence) {
        return Math.pow(10, val.numColoredCells) * (20 - val.numMovesUntilComplete);
    }

    private pickRandomMaxScoreMove(moves: Array<{ score: number, move: Move }>) {
        const maxScore = moves[moves.length - 1].score;
        const bestMoves = moves.filter(o => o.score === maxScore).map(o => o.move);
        const randomInt = (bound: number) => Math.floor(Math.random() * bound);
        const i = randomInt(bestMoves.length);
        return bestMoves[i];
    }
}

interface GroupValence { numColoredCells: number; numMovesUntilComplete: number; }

enum Vector { N, E, NE, NW }



/*

The following describes the strategy behind the heuristic evaluation function.

The main concepts are "group" and "valence".

A group is a set of 4 adjacent cells which may hold a connect-four combination - in future - i.e. in a game state whose
ancestor is the current state.

Cells in a group must be set with the color of interest or be empty. If a cell has the opponent color, the group is not valid.

Assuming "r" refers to a red cell and "e" is an empty cell, this example position shows a few such groups.

e e e e e e e
e e e e e e e
e e e e e e e
e e e e e e e
e r e r e e e
e r r r e e e

Groups can be vertical, horizontal or diagonal, just like connect-four combinations.

Groups are scored based on how many colored cells they contain and how many moves need to be played
until the group becomes a full connect-four combination.

The more colored cells it contains, the more likely it is that the group will become complete.
On the other hand the more moves need to be played, the less likely it is that the group will become complete.

To help evaluate groups, we collect the two properties into an object called valence.

A group with three cells, which can become a connect-four combination in the next move, is special.

A position with two such groups guarantees victory, because the opponent can't defend against it (see bottom row).
Such a position should fetch the highest score.

*/



