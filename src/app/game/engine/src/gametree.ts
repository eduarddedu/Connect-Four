import { State } from './types';
import { GameNode } from './gamenode';
import { Timer } from './timer';

export class GameTree {
    root: GameNode;
    readonly MAX_DEPTH = 8;
    readonly depth: number;
    private step: number;

    constructor(root: GameNode | null, depth = 1) {
        if (!(0 < depth && depth <= this.MAX_DEPTH)) {
            throw new Error('0 < depth <= 8');
        }
        this.depth = depth;
        if (root) {
            this.root = root;
        } else {
            this.root = new GameNode(null);
        }
        this.step = depth;
        const millis = Timer.execute(this.makeChildren, this, [[this.root]]);
        this.taskEnd(millis);
    }

    private makeChildren(ply: GameNode[]) {
        if (ply.length === 0 || this.step-- === 0) {
            return;
        }
        const children = [];
        for (const parent of ply) {
            for (const move of parent.nextLegalMoves()) {
                const child = new GameNode(parent);
                child.takeMove(move);
                if (child.state === State.RED_MOVES || child.state === State.YELLOW_MOVES) {
                    children.push(child);
                }
            }
        }
        this.makeChildren(children);
    }

    private taskEnd(millis: number) {
        console.log('Tree [level = ' + this.depth + '] complete in ' + millis + ' millis');
    }
}
