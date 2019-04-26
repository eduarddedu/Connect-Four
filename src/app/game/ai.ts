export class AI {
    private game: Game;
    private PLIES = 4;

    constructor(redMovesFirst: boolean, previousMoves: string[]) {
        this.game = new Game(redMovesFirst, previousMoves);
    }

    update(id: string) {
        this.game.move(+id);
    }

    randomMove() {
        const nextMoveOptions = this.game.nextMoveOptions;
        return nextMoveOptions[Math.floor(Math.random() * nextMoveOptions.length)];
    }

    nextBestMove() {
        return this.minimaxRoot();
    }

    gameover() {
        return this.game.gameover;
    }

    private minimaxRoot() {
        let bestMove = null;
        let bestValue = Infinity;
        for (const id of this.game.nextMoveOptions) {
            this.game.move(id);
            if (this.game.gameover) {
                bestMove = id;
                this.game.undo();
                break;
            } else {
                const value = this.minimax(this.PLIES, -Infinity, Infinity, true);
                if (value <= bestValue) {
                    bestValue = value;
                    bestMove = id;
                }
                this.game.undo();
            }
        }
        return bestMove;
    }

    private minimax(depth: number, alpha: number, beta: number, isMaximisingPlayer: boolean): number {
        if (this.game.gameover) {
            return isMaximisingPlayer ? -Infinity : Infinity;
        }
        if (depth === 0) {
            return this.evaluate();
        } else {
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
    }

    private evaluate(): number {
        const evaluateForColor = (color: 'red' | 'yellow') => {
            const scoreCells = (cells: number[]) => {
                const emptyCells = [], coloredCells = [];
                for (const cell of cells) {
                    const cellColor = this.game.map.get(cell);
                    if (cellColor === null) {
                        emptyCells.push(cell);
                    } else if (cellColor === color) {
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
        return evaluateForColor('red') - evaluateForColor('yellow');
    }

}

class Game {
    map: Map<number, string> = new Map();
    matrix = [
        [11, 15, 13, 14, 15, 16, 17],
        [21, 22, 23, 24, 25, 26, 27],
        [31, 32, 33, 34, 35, 36, 37],
        [41, 42, 43, 44, 45, 46, 47],
        [51, 52, 53, 54, 55, 56, 57],
        [61, 62, 63, 64, 65, 66, 67]
    ];
    turn: IterableIterator<string>;
    moves: number[];
    redMovesFirst: boolean;
    constructor(redMovesFirst: boolean, previousMoves: string[]) {
        const Generator = function* () {
            let redsTurn = redMovesFirst;
            while (true) {
                yield redsTurn ? 'red' : 'yellow';
                redsTurn = !redsTurn;
            }
        };
        this.turn = Generator();
        this.redMovesFirst = redMovesFirst;
        this.moves = previousMoves.map(id => +id);
        this.matrix.forEach(row => row.forEach(id => this.map.set(id, null)));
        this.moves.forEach(id => this.map.set(id, this.turn.next().value));
    }

    move(id: number) {
        this.moves.push(id);
        this.map.set(id, this.turn.next().value);
    }

    undo() {
        if (this.moves.length > 0) {
            const id = this.moves.pop();
            this.map.set(id, null);
            this.turn.next();
        }
    }

    get nextMoveOptions() {
        const nextMoveOptions = [];
        for (let i = 0; i < this.matrix.length; i++) {
            const row = this.matrix[i];
            if (i === 5) { // we're iterating over the base row
                for (const id of row) {
                    if (!this.moves.includes(id)) {
                        nextMoveOptions.push(id); // for base row any empty cell can be taken
                    } else { // if cell is not empty, take the slot on top if empty
                        const col = id % 10;
                        const idOnTop = i * 10 + col;
                        if (!this.moves.includes(idOnTop)) {
                            nextMoveOptions.push(idOnTop);
                        }
                    }
                }
            } else { // if this isn't the base row, only an empty cell standing on top of an occupied cell can be taken
                for (const id of row) {
                    if (this.moves.includes(id) && i >= 1) { // if (i === 0) => there is no row on top
                        const col = id % 10;
                        const idOnTop = i * 10 + col;
                        if (!this.moves.includes(idOnTop)) {
                            nextMoveOptions.push(idOnTop);
                        }
                    }
                }
            }
        }
        return nextMoveOptions;
    }

    get gameover() {
        if (this.moves.length < 7) {
            return false;
        }
        const lastMoveColor = this.turn.next() && this.turn.next().value;
        const check: (array: number[]) => boolean = (array: number[]) => {
            if (array.length < 4) {
                return false;
            }
            let connected = [];
            for (const id of array) {
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
        const move = this.moves[this.moves.length - 1];
        const row = Math.floor(move / 10), col = move % 10;

        const checkRow = () => {
            const arr = [];
            for (let c = 1; c <= 7; c++) {
                arr.push(row * 10 + c);
            }
            return check(arr);
        };
        const checkColumn = () => {
            const arr = [];
            for (let r = 1; r <= 6; r++) {
                arr.push(r * 10 + col);
            }
            return check(arr);
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
            return check(mainDiagonal) || check(counterDiagonal);
        };
        return checkRow() || checkColumn() || checkDiagonals();
    }
}


/*
The AI class provide "intelligent" methods to detect game over states, to list
next move options and to find out the next best move. The last method relies on minimax algorithm.

The minimax algorithm returns a number in the range [-Infinity, Infinity].
It relies on a heuristic function which evaluates game states.

The function works by scanning the board, identifying, counting and scoring arrays or permutations.

An array or permutation is formed by four cells connected horizontally, vertically or diagonally.
It can be any permutation where at least one cell is colored and the other three are empty or colored with the same color.

c e e e
e c e e
e c e c
c e c c
etc

are all valid arrays.

While an array of four colored cells is equal to Infinity, lesser arrays are scored based on powers of ten.
For ex, a array with one colored cell fetches 20 x 10^0, a array with two colored cells fetches 20 x 10^1.

Why 20? Because the final array score also depends on the minimum number of moves necesary to complete it.

c e e e x x x
x x e e x x x <= bottom row

The -- c e e e -- array needs a minimum of 5 moves for the three empty cells to get colored discs.

Because the maximum of the minimum number of moves an array may need is 18, the score of an array is
S = (20 - k) x 10^n
where n = array.length - 1 and k is the minimum number of moves until completion.
*/
