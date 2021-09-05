import { Color } from './types';
import { Move } from './move';
import { GameTree } from './gametree';
import { GameNode, State } from './gamenode';

export class Agent {
    private color: Color;
    private node: GameNode;

    constructor(color: Color, initialState: State.RED_MOVES | State.YELLOW_MOVES) {
        this.color = color;
        this.node = GameNode.rootNode(initialState);
    }

    public get move(): Move {
        this.assertIsAgentTurnToMove();
        this.updateGame(this.calculateMove());
        return this.node.move;
    }

    public takeMove(move: Move) {
        this.updateGame(move);
    }

    private updateGame(move: Move) {
        this.node = this.node.childNode(move);
    }

    private calculateMove(): Move {
        /** Being the maximizing player, the agent chooses the move with highest maximin value */
        const options = this.principalVariation();
        const maxScore = options[options.length - 1].score;
        const optimalMoves = options.filter(o => o.score === maxScore).map(o => o.move);
        return this.pickRandomItem(optimalMoves);
    }

    /**
     * @returns next legal moves with a calculated score value for each move
     */
    private principalVariation(): Array<{ score: number, move: Move }> {
        const searchTree = new GameTree(this.node);
        return this.maximinRoot(searchTree);
    }

    private maximinRoot(tree: GameTree): { score: number, move: Move }[] {
        const moves = [];
        for (const child of tree.root.children) {
            const value = this.maximin(child, false, -Infinity, Infinity);
            moves.push({ score: value, move: child.move });
        }
        return moves.sort((a: any, b: any) => a.score - b.score);
    }

    private maximin(node: GameNode, maximizingPlayer: boolean, alpha: number, beta: number) {
        if (node.children.length === 0) {
            return this.evaluateNode(node);
        }
        if (maximizingPlayer) {
            for (const child of node.children) {
                alpha = Math.max(alpha, this.maximin(child, false, alpha, beta));
                if (alpha >= beta) {
                    return alpha;
                }
            }
            return alpha;
        } else {
            for (const child of node.children) {
                beta = Math.min(beta, this.maximin(child, true, alpha, beta));
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
                return this.color === Color.RED ? Infinity : -Infinity;
            case State.YELLOW_WINS:
                return this.color === Color.YELLOW ? Infinity : -Infinity;
            case State.DRAW:
                return 0;
            default:
                return this.evaluateNodeInTransitoryState(node);
        }
    }

    private evaluateNodeInTransitoryState(node: GameNode) {
        const board = node.getBoard();
        const redStrength = this.evaluatePositionStrength(Color.RED, board);
        const yellowStrength = this.evaluatePositionStrength(Color.YELLOW, board);
        return this.color === Color.RED ? redStrength - yellowStrength : yellowStrength - redStrength;
    }

    private evaluatePositionStrength(color: Color, board: Color[][]): number {
        let score = 0;
        let foundDegreeOneGroup = false;
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 7; x++) {
                for (const v of [Vector.N, Vector.E, Vector.NE, Vector.NW]) {
                    const valence = this.groupValence(x, y, v, board, color);
                    if (valence) {
                        if (valence.numColoredCells === 3 && valence.numMovesUntilComplete === 1) {
                            if (foundDegreeOneGroup) {
                                return Math.pow(10, 9);
                            } else {
                                foundDegreeOneGroup = true;
                            }
                        }
                        score += this.groupValue(valence);
                    }
                }
            }
        }
        return score;
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
                if (x <= 2 && y <= 2) {
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

    private pickRandomItem(arr: any[]) {
        if (arr.length === 0) {
            throw new Error('Array is empty');
        }
        const i = this.randomInt(arr.length);
        return arr[i];
    }

    private randomInt(bound: number) {
        return Math.floor(Math.random() * bound);
    }

    private assertIsAgentTurnToMove() {
        if (!(
            (this.node.state === State.YELLOW_MOVES && this.color === Color.YELLOW) ||
            (this.node.state === State.RED_MOVES && this.color === Color.RED))
        ) {
            throw new Error('Illegal state: not agent\'s turn to move');
        }
    }
}

interface GroupValence { numColoredCells: number; numMovesUntilComplete: number; }

enum Vector { N, E, NE, NW }



/*

The following describes the strategy employed by our naive heuristic evaluation function.

The main concepts are "group" and "valence".

A group is a set of 4 adjacent cells which might make a connect-four combination in the future, as the game evolves.

Cells in a group must be set with the color of interest or empty. If a cell has the opponent color, the group is not valid.

Assuming "r" refers to a red cell and "e" is an empty cell, this example position shows a few such groups.

e e e e e e e
e e e e e e e
e e e e e e e
e e e e e e e
e r e r e e e
e r r r e e e

Obviously groups can be vertical, horizontal or diagonal, just like connect-four combinations.

Groups are scored based on how many colored cells they contain and how many moves need to be played
until the group can become a full connect-four combination.

The more colored cells it contains, the more likely it is that the group will become complete.
On the other hand the more turns need to be played, the less likely it is that the group will become complete.

To help evaluate groups, we collect the two properties into an object called valence.

A group with a single empty cell which can be set in the next move is special.

A position with two such groups guarantees victory, because the opponent can't defend against it (see bottom row).
Such a position should fetch the highest score.

*/



