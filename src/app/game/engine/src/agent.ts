import { Color } from './types';
import { Move } from './move';
import { GameTree } from './gametree';
import { GameNode, State } from './gamenode';

export class Agent {
    private color: Color;

    constructor(color: Color) {
        this.color = color;
    }

    public nextNode(parent: GameNode): GameNode {
        this.checkState(parent);
        const move = this.pickMove(parent);
        return GameNode.childNode(parent, move);
    }

    /** Agent is the maximizing player */
    private pickMove(node: GameNode) {
        const scoredMoves = this.principalVariation(node);
        const maxScore = scoredMoves[scoredMoves.length - 1].score;
        const optimalMoves = scoredMoves.filter(o => o.score === maxScore).map(o => o.move);
        return this.pickRandomItem(optimalMoves);
    }

    /**
     * @param node the game in a given state
     * @returns next legal moves with a calculated score value for each move
     */
    private principalVariation(node: GameNode): Array<{ score: number, move: Move }> {
        const searchTree = GameTree.fromChildNode(node);
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
        const result: GroupValence = { numColoredCells: 0, numMovesUntilComplete: 0 };
        const opponentColor = color === Color.RED ? Color.YELLOW : Color.RED;
        switch (v) {
            case Vector.NW:
                if (x >= 3 && y <= 2) {
                    for (let i = 0; i <= 3; i++) {
                        const cellColor = grid[x - i][y + i];
                        if (cellColor === opponentColor) {
                            return null;
                        } else if (cellColor === color) {
                            result.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[x][k] === undefined) {
                                result.numMovesUntilComplete++;
                            }
                        }
                    }
                    return result;
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
                            result.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[x][k] === undefined) {
                                result.numMovesUntilComplete++;
                            }
                        }
                    }
                    return result;
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
                            result.numColoredCells++;
                        } else {
                            result.numMovesUntilComplete++;
                        }
                    }
                    return result;
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
                            result.numColoredCells++;
                        } else {
                            let k = y + 1;
                            while (--k >= 0 && grid[_x][k] === undefined) {
                                result.numMovesUntilComplete++;
                            }
                        }
                    }
                    return result;
                } else {
                    return null;
                }
        }
    }

    private groupValue(val: GroupValence) {
        return Math.pow(10, val.numColoredCells) * (20 - val.numMovesUntilComplete);
    }

    private pickRandomItem(arr: any[]) {
        const i = this.randomInt(arr.length);
        return arr[i];
    }

    private randomInt(bound: number) {
        return Math.floor(Math.random() * bound);
    }

    private checkState(node: GameNode) {
        switch (node.state) {
            case State.RED_MOVES:
                if (this.color === Color.YELLOW) {
                    throw new Error('Illegal state: agent plays yellow');
                }
                break;
            case State.YELLOW_MOVES:
                if (this.color === Color.RED) {
                    throw new Error('Illegal state: agent plays red');
                }
                break;
            default:
                throw new Error('Illegal state: game over');
        }
    }
}

interface GroupValence { numColoredCells: number; numMovesUntilComplete: number; }

enum Vector { N, E, NE, NW }



/*

Let's define the concepts for our heuristic evaluation function.

A group is a set of 4 adjacent cells which may hold a connect-four combination in the future, as the game evolves.

Cells should be set with the color of interest or empty.

Assuming that "r" refers to a red cell and "e" is an empty cell, let's consider the example position.

e e e e e e e
e e e e e e e
e e e e e e e
e e e e e e e
e r e r e e e
e r r r e e e

Groups can be vertical, horizontal or diagonal, just like connect-four combinations.

Groups are scored based on how many colored cells they contain
and how many moves they need to become a full connect-four combination.

The two properties are called valence.

A 3-group with an empty cell which can be set in the next turn is special.

A position with two such groups (see bottom row) guarantees victory, because the opponent can't defend against it.
Such a position should fetch the highest score.

*/



