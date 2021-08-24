import { Status } from './types';
import { Move } from './move';
import { GameTree } from './gametree';
import { GameNode } from './gamenode';

export class Agent {

    principalVariation(node: GameNode): Move[] {
        if (node.status !== Status.RED_MOVES) {
            throw new Error('Illegal state: game status must be RED_MOVES');
        }
        const tree = new GameTree(node);
        return this.maximinRoot(tree);
    }

    private maximinRoot(tree: GameTree): Move[] {
        const moves = [];
        let minimum = -Infinity;
        for (const child of tree.root.children) {
            const value = Math.max(minimum, this.maximin(child, -1));
            if (minimum <= value) {
                minimum = value;
                moves.push(child.move);
            }
        }
        return moves;
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

    private evaluateNode(b: GameNode): number {
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
