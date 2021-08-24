import { Color, Status, Vector, RangeX, RangeY } from './types';
import { Move } from './move';

export class GameNode {
    status: Status;
    level: number;
    move: Move;
    parent: GameNode;
    children: GameNode[] = [];

    getNodeMoves(): Color[][] {
        const grid = new Array(7);
        for (let i = 0; i < 7; i++) {
            grid[i] = new Array(6);
        }
        let _node = <GameNode>this;
        while (_node) {
            const move = _node.move;
            if (move) {
                grid[move.x][move.y] = move.color;
            }
            _node = _node.parent;
        }
        return grid;
    }

    constructor(parent: GameNode) {
        if (parent) {
            this.parent = parent;
            this.parent.children.push(this);
            this.level = this.parent.level;
            this.status = this.parent.status;
        } else {
            this.level = 0;
            this.status = Status.RED_MOVES;
        }
    }


    /**
    * @returns an array of all the legal moves for the current turn
    */

    nextLegalMoves(): Move[] {
        if (this.status === Status.DRAW || this.status === Status.RED_WINS || this.status === Status.YELLOW_WINS) {
            return [];
        }
        const result: Move[] = [];
        const grid = this.getNodeMoves();
        const color = this.status === Status.RED_MOVES ? Color.RED : Color.YELLOW;
        for (let x = 0; x < 7; x++) {
            for (let y = 0; y < 6; y++) {
                if (grid[x][y] === undefined && (y === 0 || grid[x][y - 1] !== undefined)) {
                    result.push(new Move(<RangeX>x, <RangeY>y, color));
                    break;
                }
            }
        }
        return result;
    }

    takeMove(move: Move) {
        if (this.move) {
            throw new Error('Illegal state: move has already been set for this node');
        }
        this.move = move;
        this.level++;
        this.updateStatus();
    }

    private updateStatus() {
        this.checkVectors();
    }

    private checkVectors() {
        const grid = this.getNodeMoves();
        const kinds: Vector[] = Object.keys(Vector).map(key => Vector[key]);
        for (const v of kinds) {
            if (this.checkVector(v, grid)) {
                this.status = this.move.color === Color.RED ? Status.RED_WINS : Status.YELLOW_WINS;
                return;
            }
        }
        if (this.level === 42) {
            this.status = Status.DRAW;
        } else {
            this.status = this.move.color === Color.RED ? Status.YELLOW_MOVES : Status.RED_MOVES;
        }
    }

    private isSameColor(color: Color) {
        return color === this.move.color;
    }

    /**
     * @param vector a check vector, where the initial point is given by the (x, y) of the node move
     * @returns true if there are four connected cells along the check direction and false otherwise
     */

    private checkVector(v: Vector, grid: Color[][]): boolean {
        const x = this.move.x;
        const y = this.move.y;
        switch (v) {
            case Vector.S:
                if (y >= 3) {
                    for (let i = y - 1; i >= y - 3; i--) {
                        const color = grid[x][i];
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
                        const color = grid[k][i];
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
                        const color = grid[k][i];
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
                        const color = [k][y];
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
                        const color = grid[k][i];
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
                        const color = grid[k][i];
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
                        const color = grid[k][y];
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

