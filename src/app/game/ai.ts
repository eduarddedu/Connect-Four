export class AI {
    private game: Game;
    private LOOK_AHEAD = 2;

    constructor(redMovesFirst: boolean, previousMoves: string[]) {
        this.game = new Game(redMovesFirst, previousMoves);
    }

    update(id: string) {
        this.game.move(+id);
    }

    randomMove() {
        const nextMoveOptions = this.game.nextMoveOptions();
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
        let bestScore = Infinity;
        /* console.log(`next move options: ${this.game.nextMoveOptions()}`); */
        for (const id of this.game.nextMoveOptions()) {
            /* console.log(`Yellow moving to: ${id}`); */
            this.game.move(id);
            if (this.game.gameover) {
                bestMove = id;
                this.game.undo();
                break; // take the move that brings immediate victory
            } else {
                const score = this.minimax(this.LOOK_AHEAD, true);
                /* console.log(`id: ${id} -> score: ${score}`); */
                if (score <= bestScore) {
                    bestScore = score;
                    bestMove = id; // take the move that leads to the most favorable outcome
                }
                this.game.undo();
            }
        }
        /* console.log(`bestScore: `, bestScore);
        console.log('best move: ', bestMove); */
        return bestMove;
    }

    private minimax(depth: number, isMaximisingPlayer: boolean) {
        /* console.log(`DEPTH ${depth}`); */
        if (this.game.gameover) {
            return isMaximisingPlayer ? -Infinity : Infinity;
        }
        if (depth === 0) {
            return this.evaluate();
        } else {
            let bestScore = isMaximisingPlayer ? -Infinity : Infinity;
            /* console.log(`next move options: ${this.game.nextMoveOptions()}`); */
            for (const id of this.game.nextMoveOptions()) {
                /* console.log(`Red moving to: ${id}`); */
                this.game.move(id);
                if (isMaximisingPlayer) {
                    bestScore = Math.max(bestScore, this.minimax(depth - 1, false));
                } else {
                    bestScore = Math.min(bestScore, this.minimax(depth - 1, true));
                }
                this.game.undo();
            }
            /* console.log('returning score: ', bestScore); */
            return bestScore;
        }
    }

    private evaluate(): number {
        const evaluateForColor = (color: 'red' | 'yellow') => {
            const scoreCells = (array: number[]) => {
                const emptyCells = [], coloredCells = [];
                for (const cell of array) {
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
                const unit = Math.pow(10, coloredCells.length - 1);
                let score = 20 * unit;
                const isColumn = array.filter(cell => cell % 10 === array[0] % 10).length === 4;
                if (isColumn) {
                    score = score - emptyCells.length * unit;
                } else {
                    for (const emptyCell of emptyCells) {
                        const col = emptyCell % 10;
                        let row = Math.floor(emptyCell / 10);
                        while (row <= 6 && this.game.map.get(row * 10 + col) === null) {
                            score -= unit;
                            row++;
                        }
                    }
                }
                /* console.log(`Found combination of type ${coloredCells.length}: ${array} score: ${score}`); */
                return score;
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
            /* console.log(`evaluation for ${color}: ${totalScore}`); */
            return totalScore;
        };
        const evaluation = evaluateForColor('red') - evaluateForColor('yellow');
        /* console.log(`evaluation: ${evaluation}`); */
        return evaluation;
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

    nextMoveOptions() {
        const nextMoveOptions = [];
        for (let i = 0; i < this.matrix.length; i++) {
            const row = this.matrix[i];
            if (i === 5) { // we're iterating over the base row
                for (const slot of row) {
                    if (!this.moves.includes(slot)) {
                        nextMoveOptions.push(slot); // for base row any free slot can be taken
                    } else { // if slot is not free, we can take the slot on top (if free)
                        const col = slot % 10;
                        const topSlot = i * 10 + col;
                        if (!this.moves.includes(topSlot)) {
                            nextMoveOptions.push(topSlot);
                        }
                    }
                }
            } else { // if this isn't the base row, only a free slot standing on top of an occupied slot can be taken
                for (const pos of row) {
                    if (this.moves.includes(pos) && i >= 1) { // if (i === 0) => there is no row on top
                        const col = pos % 10;
                        const topSlot = i * 10 + col;
                        if (!this.moves.includes(topSlot)) {
                            nextMoveOptions.push(topSlot);
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
                    /* console.log(`Victory for ${lastMoveColor}: `, connected); */
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
The minimax algorithm returns a number in the range [-Infinity, Infinity].
The number is determined by scoring combinations.
A combination is 4 adjacent cells arranged horizontally, vertically or diagonally.
At least one cell must be colored for a combination to be valid, the other cells can be empty.
If any cell is colored with the opposite color, the combination is not valid.
Combinations are scored based on powers of ten.
For ex, a combination of one colored cell fetches 20 x 10^0, a combination of two colored cells
fetches 20 x 10^1.
The score formula is 20 x 10^n, where n = coloredCells.length of combination - 1.
However, the final combination score also depends on the minimal number of moves needed to complete it.

r e e e x x x
x x e e x x x

E.g. the top combination needs a minimum of 5 moves to be complete.
The maximum of the minimum number of moves a combination may need to be complete is 18.

We start out with 20 x 10^n and for each needed move we subtract 10^n,
where n = coloredCells.length of combination - minus 1.
The final score of a game state is calculated by adding up the scores of each individual red and
and yellow combinations.
Red is positive, yellow is negative. AI plays yellow and is the minimising player.
The minimising player aims to drive the evaluation down towards -Infinity.
*/
