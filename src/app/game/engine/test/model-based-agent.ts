import { ArrayLoopGenerator } from '../../..//util/generators';

export class GameModel {
    private game: Game;
    private readonly PLIES = 4;

    constructor(redMovesFirst: boolean, previousMoves: number[], private aiPlaysRed?: boolean) {
        this.game = new Game(redMovesFirst, previousMoves);
    }

    get win() {
        return this.game.win;
    }

    get draw() {
        return this.game.draw;
    }

    get nextMoveOptions() {
        return this.game.nextMoveOptions;
    }

    move(id: number) {
        this.game.move(id);
    }

    undo() {
        this.game.undo();
    }

    randomMove() {
        const nextMoveOptions = this.game.nextMoveOptions;
        return nextMoveOptions[Math.floor(Math.random() * nextMoveOptions.length)];
    }

    nextBestMove() {
        return this.minimaxRoot();
    }

    /**
     * AI is the minimising player.
     */
    private minimaxRoot() {
        let bestMove = null;
        let minimum = Infinity;
        for (const id of this.game.nextMoveOptions) {
            this.game.move(id);
            if (this.game.win) {
                this.game.undo();
                bestMove = id;
                break;
            } else {
                const value = this.minimax(this.PLIES, -Infinity, Infinity, true);
                if (value <= minimum) {
                    minimum = value;
                    bestMove = id;
                }
                this.game.undo();
            }
        }
        return bestMove;
    }

    private minimax(depth: number, alpha: number, beta: number, isMaximisingPlayer: boolean): number {

        if (this.game.win) {
            return isMaximisingPlayer ? -Infinity : Infinity;
        }
        if (this.game.draw) {
            return 0;
        }
        if (depth === 0) {
            return this.evaluateBoard();
        }

        let value = isMaximisingPlayer ? -Infinity : Infinity;
        for (const id of this.game.nextMoveOptions) {
            this.game.move(id);
            if (isMaximisingPlayer) {
                value = Math.max(value, this.minimax(depth - 1, alpha, beta, false));
                alpha = Math.max(alpha, value);
            } else {
                value = Math.min(value, this.minimax(depth - 1, alpha, beta, true));
                beta = Math.min(beta, value);
            }
            if (alpha >= beta) {
                this.game.undo();
                break;
            }
            this.game.undo();
        }
        return value;
    }


    private evaluateBoard(): number {
        const evaluateForColor = (currentColor: 'red' | 'yellow') => {
            const scoreCells = (cells: number[]) => {
                const emptyCells = [], coloredCells = [];
                for (const cell of cells) {
                    const cellColor = this.game.map.get(cell);
                    if (cellColor === null) {
                        emptyCells.push(cell);
                    } else if (cellColor === currentColor) {
                        coloredCells.push(cell);
                    } else {
                        return 0;
                    }
                }
                if (coloredCells.length === 0) {
                    return 0;
                }
                let k = 0;
                const isColumn = cells.filter(id => id % 10 === cells[0] % 10).length === 4;
                if (isColumn) {
                    k = emptyCells.length;
                } else {
                    for (const id of emptyCells) {
                        const col = id % 10;
                        let row = id - id % 10;
                        while (row <= 60 && this.game.map.get(row + col) === null) {
                            k++;
                            row += 10;
                        }
                    }
                }
                return (20 - k) * Math.pow(10, coloredCells.length - 1);
            };
            let totalScore = 0;
            // check rows
            for (let row = 10; row <= 60; row += 10) {
                for (let col = 1; col <= 4; col++) {
                    const id = row + col;
                    totalScore += scoreCells([id, id + 1, id + 2, id + 3]);
                }
            }
            // check cols
            for (let col = 1; col <= 7; col++) {
                for (let row = 10; row <= 30; row += 10) {
                    totalScore += scoreCells([row + col, row + 10 + col, row + 20 + col, row + 30 + col]);
                }
            }
            // check top left diagonal
            for (let row = 10; row <= 30; row += 10) {
                for (let col = 1; col <= 4; col++) {
                    totalScore += scoreCells([row + col, row + 10 + col + 1, row + 20 + col + 2, row + 30 + col + 3]);
                }
            }
            // check bottom left diagonal
            for (let row = 10; row <= 30; row += 10) {
                for (let col = 7; col >= 4; col--) {
                    totalScore += scoreCells([row + col, row + 10 + col - 1, row + 20 + col - 2, row + 30 + col - 3]);
                }
            }
            return totalScore;
        };
        return this.aiPlaysRed ?
            evaluateForColor('yellow') - evaluateForColor('red')
            :
            evaluateForColor('red') - evaluateForColor('yellow');
    }
}

class Game {
    map: Map<number, string> = new Map();
    matrix = [
        [11, 12, 13, 14, 15, 16, 17],
        [21, 22, 23, 24, 25, 26, 27],
        [31, 32, 33, 34, 35, 36, 37],
        [41, 42, 43, 44, 45, 46, 47],
        [51, 52, 53, 54, 55, 56, 57],
        [61, 62, 63, 64, 65, 66, 67]
    ];
    turn: IterableIterator<'red' | 'yellow'>;
    moves: number[] = [];
    _win = false;
    _draw = false;

    constructor(redMovesFirst: boolean, previousMoves: number[]) {
        const sequence = redMovesFirst ? ['red', 'yellow'] : ['yellow', 'red'];
        this.turn = ArrayLoopGenerator(sequence);
        this.matrix.forEach(row => row.forEach(id => this.map.set(id, null)));
        previousMoves.forEach(id => {
            this.moves.push(id);
            this.map.set(id, this.turn.next().value);
        });
        this.checkGame();
    }

    move(id: number) {
        this.moves.push(id);
        this.map.set(id, this.turn.next().value);
        this.checkGame();
    }

    undo() {
        if (this.moves.length > 0) {
            const id = this.moves.pop();
            this.map.set(id, null);
            this._draw = this._win = false;
            this.turn.next();
        }
    }

    get draw(): boolean {
        return this._draw;
    }

    get win(): boolean {
        return this._win;
    }

    get nextMoveOptions(): number[] {
        const nextMoveOptions = [];
        this.map.forEach((color, id, map) => {
            if (id - id % 10 === 60) {
                if (color === null) {
                    nextMoveOptions.push(id);
                }
            } else if (color === null && map.get(id + 10) !== null) {
                nextMoveOptions.push(id);
            }
        });
        return nextMoveOptions;
    }

    checkGame() {
        if (this.moves.length < 7) {
            return;
        }
        const lastMoveColor = this.turn.next() && this.turn.next().value;
        const checkCells: (cells: number[]) => boolean = (cells: number[]) => {
            if (cells.length < 4) {
                return false;
            }
            let connected = [];
            for (const id of cells) {
                if (this.map.get(id) === lastMoveColor) {
                    connected.push(id);
                } else {
                    connected = [];
                }
                if (connected.length === 4) {
                    return true;
                }
            }
            return false;
        };
        const moveId = this.moves[this.moves.length - 1];
        const row = Math.floor(moveId / 10), col = moveId % 10;

        const checkRow = () => {
            const cells = [];
            for (let c = 1; c <= 7; c++) {
                cells.push(row * 10 + c);
            }
            return checkCells(cells);
        };
        const checkColumn = () => {
            const cells = [];
            for (let r = 1; r <= 6; r++) {
                cells.push(r * 10 + col);
            }
            return checkCells(cells);
        };
        const checkDiagonals = () => {
            const mainDiagonal = [row * 10 + col];
            let r = row, c = col;
            // walk NW
            while (--r >= 1 && --c >= 1) {
                mainDiagonal.push(r * 10 + c);
            }
            mainDiagonal.reverse();
            // walk SE
            r = row, c = col;
            while (++r <= 6 && ++c <= 7) {
                mainDiagonal.push(r * 10 + c);
            }
            const counterDiagonal = [row * 10 + col];
            r = row, c = col;
            // walk NE
            while (--r >= 1 && ++c <= 7) {
                counterDiagonal.push(r * 10 + c);
            }
            counterDiagonal.reverse();
            // walks SW
            r = row, c = col;
            while (++r <= 6 && --c >= 1) {
                counterDiagonal.push(r * 10 + c);
            }
            return checkCells(mainDiagonal) || checkCells(counterDiagonal);
        };

        if (checkRow() || checkColumn() || checkDiagonals()) {
            this._win = true;
        } else if (this.moves.length === 42) {
            this._draw = true;
        }
    }
}

/*
GameModel detects when a victory or draw event occurs and selects the id for the next best move.

https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning

AI is the minimising player.

The method builds a search tree of game states and calls a heuristic value function which evaluates the leaf nodes of the tree.

The function scans the board map looking for arrays of four cells.

An array is formed when four cells are connected horizontally, vertically or diagonally, on condition that at least
one cell is colored and there aren't cells with different colors.

For example:

c e e e
e c e e
e c e c
c e c c

...etc are all valid arrays, assuming c refers to the same color, red or yellow.

While an array of four colored cells fetches a score of Infinity, lesser arrays are scored based on powers of ten.
E.g., a array with one colored cell fetches 20 x 10^0, a array with two colored cells fetches 20 x 10^1.

Why 20? Because the final array score also depends on the minimum number of moves necesary to complete it.

Example
c e e e x x x
x x e e x x x <= bottom row

The -- c e e e -- array needs a minimum of 5 moves for the three empty cells to get colored discs.

Because the maximum of the minimum number of moves an array may need is 18, the score of an array is rounded off to
S = (20 - k) x 10^n
where n = array.length - 1 and k is the minimum number of moves until completion. */
