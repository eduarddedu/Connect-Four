export class AI {
    private game: Game;

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
        return this.minmaxRoot();
    }

    gameover() {
        return this.game.gameover;
    }

    private minmaxRoot() {
        let bestMove = null;
        let bestScore = -Infinity;
        const nextMoveOptions = this.game.nextMoveOptions();
        for (const id of nextMoveOptions) {
            this.game.move(id);
            const score = this.minmax(1, true);
            if (score >= bestScore) {
                bestScore = score;
                bestMove = id;
            }
            this.game.undo();
        }
        return bestMove;
    }

    private minmax(depth: number, isMaximisingPlayer: boolean) {
        if (this.game.gameover) {
            return isMaximisingPlayer ? 10000 : -10000;
        }
        if (depth === 0) {
            return this.evaluate();
        } else {
            let bestScore = isMaximisingPlayer ? Infinity : -Infinity;
            for (const id of this.game.nextMoveOptions()) {
                this.game.move(id);
                if (isMaximisingPlayer) {
                    bestScore = Math.min(bestScore, this.minmax(depth - 1, !isMaximisingPlayer));
                } else {
                    bestScore = Math.max(bestScore, this.minmax(depth - 1, !isMaximisingPlayer));
                }
                this.game.undo();
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

    private evaluate(): number {
        let redMoves: number[], yellowMoves: number[];
        redMoves = this.game.moves.filter((id, index) => this.game.redMovesFirst ? index % 2 === 0 && id : index % 2 === 1 && id);
        yellowMoves = this.game.moves.filter((id, index) => this.game.redMovesFirst ? index % 2 === 1 && id : index % 2 === 0 && id);
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
        const lastTurnColor = this.turn.next() && this.turn.next().value;
        const check: (array: number[]) => boolean = (array: number[]) => {
            if (array.length < 4) {
                return false;
            }
            let count = 0;
            for (const id of array) {
                if (this.map.get(id) === lastTurnColor) {
                    if (++count === 4) {
                        console.log('Victory : ', array);
                        return true;
                    } else {
                        continue;
                    }
                } else {
                    count = 0;
                }
            }
            return false;
        };
        const lastMove: number = this.moves[this.moves.length - 1];
        const row = Math.floor(lastMove / 10), col = lastMove % 10;

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
