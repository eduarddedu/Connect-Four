import { Status } from './types';
import { Move } from './move';
import { Board } from './board';
import { GameTree } from './gametree';
import { GameNode } from './gamenode';

export class Agent {
    private tree: GameTree;
    private readonly DEPTH = 6;

    principalVariation(node: GameNode): Move[] {
        this.tree = new GameTree(node, this.DEPTH);
        return this.maximinRoot(this.tree.root);
    }

    private maximinRoot(node: GameNode): Move[] {
        if (node.status !== Status.RED_MOVES) {
            throw new Error('Maximin error: game status must be RED_MOVES');
        }
        const moves = [];
        let minimum = -Infinity;
        for (const child of node.children) {
            const value = Math.max(minimum, this.maximin(child, -1));
            if (minimum <= value) {
                minimum = value;
                moves.push(child.lastMove);
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
