
enum Color { RED, YELLOW }

enum Status { RED_MOVES, YELLOW_MOVES, RED_WINS, YELLOW_WINS, DRAW }

enum Vector { NE, E, SE, S, SW, W, NW }

type RangeX = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type RangeY = 0 | 1 | 2 | 3 | 4 | 5;

class Move {
    x: RangeX;
    y: RangeY;
    color: Color;
    constructor(x: RangeX, y: RangeY, color: Color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

class Board {
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

class GameNode extends Board {
    parent: GameNode;
    children: GameNode[] = [];
    constructor(parent: GameNode) {
        super(parent ? parent.grid : null);
        this.parent = parent;
        if (parent) {
            parent.children.push(this);
        }
    }

}

class Ply extends Array<GameNode> { }

class GameTree {
    root: GameNode;
    plyCount = 0; // TODO delete
    constructor() {
        this.root = new GameNode(null);
        const ply = new Ply();
        ply.push(this.root);
        this.makeChildren(ply);
    }

    private makeChildren(ply: Ply) {
        if (++this.plyCount === 8) {
            console.log('EXIT -> plyCount = ', this.plyCount);
            return;
        }
        if (ply.length === 0) {
            console.log('EXIT -> no more children');
            return;
        }
        const children = new Ply();
        for (const parent of ply) {
            for (const move of Board.nextLegalMoves(parent)) {
                const child = new GameNode(parent);
                child.takeMove(move);
                children.push(child);
            }
        }
        this.makeChildren(children);
    }
}

class Database {
    tree: GameTree;
    constructor() {
        this.tree = new GameTree();
    }

    /**
     *
     * @param node  any node in the game graph with the condition that RED moves next
     * @returns an array containing the next best moves for RED
     */

    maximinRoot(node: GameNode): Move[] {
        if (node.status !== Status.RED_MOVES) {
            throw new Error('Maximin error: game status must be RED_MOVES');
        }
        const result = [];
        let minimum = -Infinity;
        for (const child of node.children) {
            const value = Math.max(minimum, this.maximin(child, -1));
            if (minimum <= value) {
                minimum = value;
                result.push(child.lastMove);
            }
        }
        return result;
    }

    /**
     *
     * @param node the game in a given state
     * @param i index of the player of interest
     * @returns maximin value
     */

    maximin(node: GameNode, i: number) {
        if (node.children.length === 0) {
            return this.evaluateNode(node);
        }
        if (i === 1) {
            let minimum = -Infinity;
            for (const child of node.children) {
                minimum = Math.max(minimum, this.maximin(child, i * -1));
            }
            return minimum;
        } else {
            let maximum = Infinity;
            for (const child of node.children) {
                maximum = Math.min(maximum, this.maximin(child, i * -1));
            }
            return maximum;
        }
    }

    private evaluateNode(b: Board): number {
        switch (b.status) {
            case Status.RED_WINS:
                return 1;
            case Status.YELLOW_WINS:
                return -1;
            case Status.DRAW:
                return 0;
        }
    }
}

function printNode(node: GameNode) {
    console.log('NODE');
    console.log(node);
}

function printTerminalNodes(node: GameNode) {
    if (node.status === Status.DRAW || node.status === Status.RED_WINS || node.status === Status.YELLOW_WINS) {
        printNode(node);
    } else {
        for (const child of node.children) {
            printTerminalNodes(child);
        }
    }
}
let countRedWins = 0;
let countYellowWins = 0;
let countDraw = 0;

function countTerminalNodes(node: GameNode) {
    if (node.status === Status.RED_WINS) {
        countRedWins++;
    } else if (node.status === Status.YELLOW_WINS) {
        countYellowWins++;
    } else if (node.status === Status.DRAW) {
        countDraw++;
    } else {
        for (const child of node.children) {
            countTerminalNodes(child);
        }
    }
}

const db = new Database();
// printTerminalNodes(db.tree.root);
// testVectorWest();
countTerminalNodes(db.tree.root);
console.log('Terminal nodes count: ');
console.log('RED_WINS: ', countRedWins);
console.log('YELLOW_WINS: ', countYellowWins);
console.log('DRAW: ', countDraw);
function testVectorWest() {
    const root = new GameNode(null);
    const moves = [
        new Move(1, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(4, 0, Color.RED)
    ];
    for (const move of moves) {
        root.takeMove(move);
    }
}



