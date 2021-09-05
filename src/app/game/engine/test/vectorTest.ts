import { GameNode, State } from '../src/gamenode';
import { Color } from '../src/types';
import { Move } from '../src/move';

testVectorWest();
testVectorEast();
function testVectorWest() {
    const moves = [
        new Move(1, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(4, 0, Color.RED)
    ];
    testVector(moves, 'WEST');
}
function testVectorEast() {
    const moves = [
        new Move(4, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(1, 0, Color.RED)
    ];
    testVector(moves, 'EAST');
}

function testVector(moves: Move[], vectorName: string) {
    let node = GameNode.rootNode(State.RED_MOVES);
    for (const move of moves) {
        node = GameNode.childNode(node, move);
    }
    if (node.state !== State.RED_WINS) {
        throw new Error('test vector: ' + vectorName + ' state = ' + node.state);
    }
}

