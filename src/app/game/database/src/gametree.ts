import { Status } from './types';
import { GameNode } from './gamenode';

export class GameTree {
    root: GameNode;
    readonly DEPTH = 8;

    constructor(root: GameNode | null) {
        if (root) {
            this.root = root;
        } else {
            this.root = new GameNode(null);
        }
        this.makeChildren([this.root]);
    }

    private makeChildren(ply: GameNode[]) {
        if (ply.length === 0 || ply[0].level === this.DEPTH) {
            const message = ply.length === 0 ? 'No more children' : 'Tree complete at level ' + this.DEPTH;
            console.log(message);
            return;
        }
        const children = [];
        for (const parent of ply) {
            for (const move of parent.nextLegalMoves()) {
                const child = new GameNode(parent);
                child.takeMove(move);
                if (child.status === Status.RED_MOVES || child.status === Status.YELLOW_MOVES) {
                    children.push(child);
                }
            }
        }
        this.makeChildren(children);
    }
}
