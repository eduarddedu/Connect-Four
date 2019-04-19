export class AI {

    static randomMove(redMovesFirst: boolean, previousMoves: string[]) {
        const nextMoveOptions = new Board(redMovesFirst, previousMoves).nextMoveOptions();
        return nextMoveOptions[Math.floor(Math.random() * nextMoveOptions.length)];
    }

    static bestMove(redMovesFirst: boolean, previousMoves: string[]) {
        return this.minmaxRoot(redMovesFirst, previousMoves);
    }

    private static minmaxRoot(redMovesFirst: boolean, previousMoves: string[]) {
        let bestMove = null;
        let bestScore = -Infinity;
        const board = new Board(redMovesFirst, previousMoves);
        const nextMoveOptions = board.nextMoveOptions();
        for (const id of nextMoveOptions) {
            board.move(id);
            const score = this.minmax(1, board, true);
            if (score >= bestScore) {
                bestScore = score;
                bestMove = id;
            }
            board.undo();
        }
        return bestMove;
    }

    private static minmax(depth: number, board: Board, isMaximisingPlayer: boolean) {
        if (board.gameOver) {
            return isMaximisingPlayer ? 10000 : -10000;
        }
        if (depth === 0) {
            return this.evaluateBoard(board);
        } else {
            let bestScore = isMaximisingPlayer ? Infinity : -Infinity;
            for (const id of board.nextMoveOptions()) {
                board.move(id);
                if (isMaximisingPlayer) {
                    bestScore = Math.min(bestScore, this.minmax(depth - 1, board, !isMaximisingPlayer));
                } else {
                    bestScore = Math.max(bestScore, this.minmax(depth - 1, board, !isMaximisingPlayer));
                }
                board.undo();
            }
            return bestScore;
        }

    }

    /*
    The function returns a number in the range [-10000, 10000]. The number is determined with the following algorithm.
    The function scans the board looking for C1, C2, C3 and C4 distinct combinations.
    A combination means 4 adjacent slots arranged horizontally, vertically or diagonally.
    Slots can be either set with the same color or empty; at least one slot must be set.
    If one slot is set and the other are empty, we have a G1 combination.
    If two slots are set and the other are empty, we have a C2 group etc.
    We use powers of ten to score the groups, by putting combinations of the same class into sets and considering set type and size.
    C1 type gets you 10 points for type and 1 point for set size. So C1 set of size 1 = 11 points and C1 set of size 3 = 13 points.
    C2 type gets you 100 points + 10 points for set size. So C2 set of size 1 = 110 points and C2 set of size 3 = 130 points.
    C3 type gets you 1000 points + 100 points for set size. So C3 set of size 1 = 1100 and C3 set of size 3 = 1300 points.
    C4 type gets you 10000 points. If one C4 group is found we return the score w/o additional scanning and counting.
    The algorithm starts by looking for C4 combinations first.
    The next level is evaluated if and only if the superior level has no combination.
    For instance if one C3 combination is found, C2 and C1 combinations become irrelevant.
    */

    private static evaluateBoard(board: Board): number {
        let redMoves: number[], yellowMoves: number[];
        redMoves = board.moves.filter((id, index) => board.redMovesFirst ? index % 2 === 0 && id : index % 2 === 1 && id);
        yellowMoves = board.moves.filter((id, index) => board.redMovesFirst ? index % 2 === 1 && id : index % 2 === 0 && id);
        const scoreC1 = () => { },
            scoreC2 = () => { },
            scoreC3 = () => { },
            scoreC4 = (moves: number[]) => {
                if (moves.length < 4) {
                    return null;
                }
                // check
                for (let row = 1; row <= 3; row++) {
                    for (let col = 1; col <= 4; col++) {
                    }
                }
            };

        return 0;
    }

}

/**
 * A model of the board; it is used by the minmax algorithm to
 * simulate game moves and evaluate them.
 */

class Board {
    map: Map<number, string> = new Map();
    matrix = [
        [11, 12, 13, 14, 15, 16, 17],
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
            let color = redMovesFirst ? 'red' : 'yellow';
            while (true) {
                yield color;
                color = color === 'red' ? 'yellow' : 'red';
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

    get gameOver() {
        return false;
    }

}
