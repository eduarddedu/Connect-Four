export class AI {

    /* disc ids */
    private static readonly matrix = [
        [11, 12, 13, 14, 15, 16, 17],
        [21, 22, 23, 24, 25, 26, 27],
        [31, 32, 33, 34, 35, 36, 37],
        [41, 42, 43, 44, 45, 46, 47],
        [51, 52, 53, 54, 55, 56, 57],
        [61, 62, 63, 64, 65, 66, 67]
    ];

    // evaluation scale L1, L2, L3, L4
    // A: how many distinct connect-four outcomes can the board evolve to - potentially?
    // B: for each connect-four outcome, what is the progress or completeness level, on a scale of 1 to 4
    // L1x5, L1x2 + L2x2
    static bestMove() {
        const board: Map<number, string> = this.mapBoard();
    }

    private static mapBoard(): Map<number, string> {
        const map: Map<number, string> = new Map();
        for (const row of this.matrix) {
            for (const id of row) {
                const disc = document.getElementById(`${id}`);
                const color = disc.classList.contains('red') ? 'red' : disc.classList.contains('yellow') ? 'yellow' : null;
                map.set(id, color);
            }
        }
        return map;
    }

    private static minmax(depth: number, game: Map<number, string>, isMaximisingPlayer: boolean) {
        if (depth === 0) {
            return this.evaluateBoard(game, 'red');
        }

    }

    private static evaluateBoard(board: Map<number, string>, turn: 'red' | 'yellow'): number {

        return null;
    }

    private static evaluateRow(row: Map<number, string>) {
        /*
        n n n n n n n
        n n n n n n n
        n n n n n n n
        n n n n n n n
        n n n n n n n
        n n n n n n n
        */
    }


    static randomMove(previousMoves: string[]) {
        console.log(this.mapBoard());
        const nextMoveOptions = this.nextMoveOptions(previousMoves);
        return nextMoveOptions[Math.floor(Math.random() * nextMoveOptions.length)];
    }

    private static nextMoveOptions(previousMoves: string[]) {
        const moves: number[] = previousMoves.map(x => +x);
        const nextMoveOptions = [];
        for (let i = 0; i < this.matrix.length; i++) {
            const row = this.matrix[i];
            if (i === 5) {
                // row is base row
                for (const slot of row) {
                    if (!moves.includes(slot)) {
                        // for base row any free slot can be taken
                        nextMoveOptions.push(slot);
                    } else {
                        // if slot is not free, we can take the slot on top (if free)
                        const col = slot % 10;
                        const topSlot = i * 10 + col;
                        if (!moves.includes(topSlot)) {
                            nextMoveOptions.push(topSlot);
                        }
                    }
                }
            } else {
                // row is not the base row; only slot on top of occupied slot can be taken
                for (const pos of row) {
                    if (moves.includes(pos) && i !== 0) { // make sure there **is** a row on top
                        const col = pos % 10;
                        const topSlot = i * 10 + col;
                        if (!moves.includes(topSlot)) {
                            nextMoveOptions.push(topSlot);
                        }
                    }
                }
            }
        }
        return nextMoveOptions;
    }

}
