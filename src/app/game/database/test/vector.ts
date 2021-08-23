import { GameNode } from '../src/gamenode';
import { Color, Status } from '../src/types';
import { Move } from '../src/move';

testVectorWest();
testVectorEast();
function testVectorWest() {
    const root = new GameNode(null);
    const moves = [
        new Move(1, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(4, 0, Color.RED)
    ];
    for (const move of moves) {
        root.takeMove(move);
    }
    if (root.status !== Status.RED_WINS) {
        throw new Error('testVectorWest ... status = ' + root.status);
    }
}
function testVectorEast() {
    const root = new GameNode(null);
    const moves = [
        new Move(4, 0, Color.RED),
        new Move(0, 0, Color.YELLOW),
        new Move(3, 0, Color.RED),
        new Move(0, 1, Color.YELLOW),
        new Move(2, 0, Color.RED),
        new Move(0, 2, Color.YELLOW),
        new Move(1, 0, Color.RED)
    ];
    for (const move of moves) {
        root.takeMove(move);
    }
    if (root.status !== Status.RED_WINS) {
        throw new Error('testVectorEast ...  status = ' + root.status);
    }
}

