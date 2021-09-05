import { GameNode, State } from './gamenode';
import { Timer } from './timer';

export class GameTree {
    root: GameNode;
    readonly MAX_DEPTH = 8;
    private readonly depth: number;
    private step: number;

    static fromRootNode(initialState: State.RED_MOVES | State.YELLOW_MOVES, depth = 2) {
        return new GameTree(GameNode.rootNode(initialState), depth);
    }

    static fromChildNode(node: GameNode, depth = 2) {
        return new GameTree(node, depth);
    }

    private constructor(node: GameNode, depth: number) {
        if (!(0 < depth && depth <= this.MAX_DEPTH)) {
            throw new Error('0 < depth <= 8');
        }
        this.root = node;
        this.depth = depth;
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
                const child = GameNode.childNode(parent, move);
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
