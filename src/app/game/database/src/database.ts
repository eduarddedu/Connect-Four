import { Status } from './types';
import { Move } from './move';
import { GameTree } from './gametree';
import { GameNode } from './gamenode';

export class Database {
    tree: GameTree;
    constructor() {
        this.tree = new GameTree(null);
    }

    /**
     *
     * @param node  any node in the game tree with the condition that RED moves next
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
                result.push(child.move);
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



