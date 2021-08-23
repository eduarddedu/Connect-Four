import { Board } from './board';

export class GameNode extends Board {
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
