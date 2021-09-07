import { Color, RangeX, RangeY } from './types';
import { Move } from './move';

export enum State { RED_MOVES, YELLOW_MOVES, RED_WINS, YELLOW_WINS, DRAW }

export class GameNode {
    state: State;
    level: number;
    move: Move;
    parent: GameNode;
    children: GameNode[] = [];

    static rootNode(initialState: State.RED_MOVES | State.YELLOW_MOVES) {
        return new GameNode(null, initialState);
    }

    private constructor(parent: GameNode, initialState?: State.RED_MOVES | State.YELLOW_MOVES) {
        if (parent) {
            this.parent = parent;
            this.parent.children.push(this);
            this.level = this.parent.level;
            this.state = this.parent.state;
        } else {
            this.level = 0;
            this.state = initialState;
        }
    }

    /**
     * @param move a move
     * @returns the game node resulting from the move
     */
    childNode(move: Move): GameNode {
        this.assertLegalMove(move);
        const child = new GameNode(this);
        child.takeMove(move);
        return child;
    }

    private assertLegalMove(m: Move) {
        const isLegal = this.nextLegalMoves
            .find(v => v.x === m.x && v.y === m.y && v.color === m.color) !== undefined;
            if (!isLegal) {
                throw new Error('Illegal move: {x: ' + m.x + ', y: ' + m.y + ', color: ' + m.color + '}');
            }
    }

    /**
    * @returns an array containing all the legal moves for the current turn
    */
    get nextLegalMoves(): Move[] {
        if (this.state === State.DRAW || this.state === State.RED_WINS || this.state === State.YELLOW_WINS) {
            return [];
        }
        const result: Move[] = [];
        const grid = this.getBoard();
        const color = this.state === State.RED_MOVES ? Color.RED : Color.YELLOW;
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

    getBoard(): Color[][] {
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

    private takeMove(move: Move) {
        this.move = move;
        this.level++;
        this.updateState();
    }

    private updateState() {
        const grid = this.getBoard();
        const kinds: Direction[] = Object.keys(Direction).map(key => Direction[key]);
        for (const direction of kinds) {
            if (this.isConnectFour(direction, grid)) {
                this.state = this.move.color === Color.RED ? State.RED_WINS : State.YELLOW_WINS;
                return;
            }
        }
        if (this.level === 42) {
            this.state = State.DRAW;
        } else {
            this.state = this.move.color === Color.RED ? State.YELLOW_MOVES : State.RED_MOVES;
        }
    }

    private isConnectFour(d: Direction, grid: Color[][]): boolean {
        const x = this.move.x;
        const y = this.move.y;
        let i: number, j: number;
        let numConnectedCells = 0;
        function checker(color: Color) {
            if (color === this.move.color) {
                numConnectedCells++;
            } else {
                numConnectedCells = 0;
            }
            return numConnectedCells === 4;
        }
        const isConnectFour = checker.bind(this);
        switch (d) {
            case Direction.VERTICAL:
                for (j = y; j >= Math.max(0, y - 3); j--) {
                    if (isConnectFour(grid[x][j])) {
                        return true;
                    }
                }
                return false;
            case Direction.HORIZONTAL:
                for (i = Math.max(0, x - 3); i <= Math.min(6, x + 3); i++) {
                    if (isConnectFour(grid[i][y])) {
                        return true;
                    }
                }
                return false;
            case Direction.TOP_LEFT_DIAGONAL:
                i = x;
                j = y;
                while (i > 0 && j < 5) {
                    i--;
                    j++;
                }
                for (; i < 7 && j >= 0; i++, j--) {
                    if (isConnectFour(grid[i][j])) {
                        return true;
                    }
                }
                return false;
            case Direction.TOP_RIGHT_DIAGONAL:
                i = x;
                j = y;
                while (i < 6 && j < 5) {
                    i++;
                    j++;
                }
                for (; i >= 0 && j >= 0; i--, j--) {
                    if (isConnectFour(grid[i][j])) {
                        return true;
                    }
                }
                return false;
        }
    }
}


enum Direction { HORIZONTAL, TOP_RIGHT_DIAGONAL, TOP_LEFT_DIAGONAL, VERTICAL }

