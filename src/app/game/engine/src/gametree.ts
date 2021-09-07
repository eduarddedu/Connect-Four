import { GameNode, State } from './gamenode';
import { Timer } from './timer';

export class GameTree {
    static readonly MAX_DEPTH = 8;
    readonly root: GameNode;
    readonly depth: number;
    private level = 0;
    private readonly debug = false;

    constructor(node: GameNode, depth = 6) {
        if (!(0 < depth && depth <= GameTree.MAX_DEPTH)) {
            throw new Error('0 < depth <= 8');
        }
        this.root = node;
        this.depth = depth;
        const millis = Timer.execute(this.makeChildren, this, [[this.root]]);
        this.taskEnd(millis);
    }

    private makeChildren(ply: GameNode[]) {
        if (ply.length === 0 || this.level++ === this.depth) {
            return;
        }
        const children = [];
        for (const parent of ply) {
            for (const move of parent.nextLegalMoves) {
                const child = parent.childNode(move);
                if (child.state === State.RED_MOVES || child.state === State.YELLOW_MOVES) {
                    children.push(child);
                }
            }
        }
        this.makeChildren(children);
    }

    private taskEnd(millis: number) {
        if (this.debug) {
            console.log('Tree [depth = ' + this.depth + '] complete in ' + millis + ' millis');
        }
    }
}
