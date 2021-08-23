import { Board } from './board';
import { GameNode } from './gamenode';

class Ply extends Array<GameNode> { }

export class GameTree {
    root: GameNode;
    step = 0;
    readonly DEPTH: number;
    constructor(root: GameNode | null, depth: number) {
        if (root) {
            this.root = root;
        } else {
            this.root = new GameNode(null);
        }
        this.DEPTH = depth;
        this.makeChildren([this.root]);
    }

    private makeChildren(ply: Ply) {
        if (++this.step === this.DEPTH) {
            console.log('Tree complete at level', this.DEPTH);
            return;
        }
        if (ply.length === 0) {
            console.log('Tree complete at level', this.step, 'No more children.');
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
