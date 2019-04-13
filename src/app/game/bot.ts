export class Bot {
    private static readonly boardMatrix = [
        [11, 12, 13, 14, 15, 16, 17],
        [21, 22, 23, 24, 25, 26, 27],
        [31, 32, 33, 34, 35, 36, 37],
        [41, 42, 43, 44, 45, 46, 47],
        [51, 52, 53, 54, 55, 56, 57],
        [61, 62, 63, 64, 65, 66, 67]
    ];
    static randomMove(previousMoves: string[]) {
        const nextMoveOptions = this.nextMoveOptions(previousMoves);
        return nextMoveOptions[Math.floor(Math.random() * nextMoveOptions.length)];
    }

    private static nextMoveOptions(previousMoves: string[]) {
        const moves: number[] = previousMoves.map(x => +x);
        const nextMoveOptions = [];
        for (let i = 0; i < this.boardMatrix.length; i++) {
            const row = this.boardMatrix[i];
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
