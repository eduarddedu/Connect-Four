import { Color, RangeX, RangeY, Status, Vector } from './types';
import { Move } from './move';

export class Board {
    grid: Color[][];
    status: Status;
    movesCount = 0;
    lastMove: Move;

    /**
    * @param board the board in a given state
    * @returns an array of all legal moves for the current turn
    */

    static nextLegalMoves(board: Board): Move[] {
        if (board.status === Status.DRAW || board.status === Status.RED_WINS || board.status === Status.YELLOW_WINS) {
            return [];
        } else {
            const color = board.status === Status.RED_MOVES ? Color.RED : Color.YELLOW;
            const result: Move[] = [];
            for (let x = 0; x < 7; x++) {
                for (let y = 0; y < 6; y++) {
                    if (board.grid[x][y] === undefined && (y === 0 || board.grid[x][y - 1] !== undefined)) {
                        result.push(new Move(<RangeX>x, <RangeY>y, color));
                    }
                }
            }
            return result;
        }
    }

    constructor(moves: Color[][]) {
        this.grid = new Array(7);
        for (let i = 0; i < 7; i++) {
            this.grid[i] = new Array(6);
        }
        if (moves) {
            for (let x = 0; x < 7; x++) {
                for (let y = 0; y < 6; y++) {
                    if (moves[x][y] !== undefined) {
                        this.grid[x][y] = moves[x][y];
                        this.movesCount++;
                    }
                }
            }
            this.status = this.movesCount % 2 === 0 ? Status.RED_MOVES : Status.YELLOW_MOVES;
        } else {
            this.movesCount = 0;
            this.status = Status.RED_MOVES;
        }
    }

    takeMove(move: Move) {
        this.grid[move.x][move.y] = move.color;
        this.lastMove = move;
        this.movesCount++;
        this.updateStatus();
    }

    private updateStatus() {
        this.checkVectors();
    }

    private checkVectors() {
        const kinds: Vector[] = Object.keys(Vector).map(key => Vector[key]);
        for (const v of kinds) {
            if (this.checkVector(v)) {
                this.status = this.lastMove.color === Color.RED ? Status.RED_WINS : Status.YELLOW_WINS;
                return;
            }
        }
        if (this.movesCount === 42) {
            this.status = Status.DRAW;
        } else {
            this.status = this.lastMove.color === Color.RED ? Status.YELLOW_MOVES : Status.RED_MOVES;
        }
    }

    private isSameColor(color: Color) {
        return color === this.lastMove.color;
    }


    /**
     * @param vector a check vector, where the initial point is given by the (x, y) of the last move
     * @returns true if there are four connected cells along the check direction and false otherwise
     */

    private checkVector(v: Vector): boolean {
        const x = this.lastMove.x;
        const y = this.lastMove.y;
        switch (v) {
            case Vector.S:
                if (y >= 3) {
                    for (let i = y - 1; i >= y - 3; i--) {
                        const color = this.grid[x][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.SE:
                if (x <= 3 && y >= 3) {
                    for (let k = x + 1, i = y - 1; k <= x + 3; k++, i--) {
                        const color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.SW:
                if (x >= 3 && y >= 3) {
                    for (let k = x - 1, i = y - 1; k >= 0; k--, i--) {
                        const color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.W:
                if (x >= 3) {
                    for (let k = x - 1; k >= x - 3; k--) {
                        const color = this.grid[k][y];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.NW:
                if (x >= 3 && y <= 2) {
                    for (let k = x - 1, i = y + 1; k >= x - 3; k--, i++) {
                        const color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.NE:
                if (x <= 3 && y <= 2) {
                    for (let k = x + 1, i = y + 1; k <= x + 3; k++, i++) {
                        const color = this.grid[k][i];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            case Vector.E:
                if (x <= 3) {
                    for (let k = x + 1; k <= x + 3; k++) {
                        const color = this.grid[k][y];
                        if (!this.isSameColor(color)) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
        }
    }
}

