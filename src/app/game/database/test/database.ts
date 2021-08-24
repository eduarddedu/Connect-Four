import { Status, Color } from '../src/types';
import { Move } from '../src/move';
import { Database } from '../src/database';
import { GameNode } from '../src/gamenode';

function printNode(node: GameNode) {
    console.log('NODE');
    console.log(node);
}

function printTerminalNodes(node: GameNode) {
    if (node.status === Status.DRAW || node.status === Status.RED_WINS || node.status === Status.YELLOW_WINS) {
        printNode(node);
    } else {
        for (const child of node.children) {
            printTerminalNodes(child);
        }
    }
}

let countRedWins = 0;
let countYellowWins = 0;
let countDraw = 0;
let countNonTerminalNodes = 0;

function countNodes(node: GameNode) {
    if (node.status === Status.RED_WINS) {
        countRedWins++;
    } else if (node.status === Status.YELLOW_WINS) {
        countYellowWins++;
    } else if (node.status === Status.DRAW) {
        countDraw++;
    } else {
        countNonTerminalNodes++;
        for (const child of node.children) {
            countNodes(child);
        }
    }
}

const db = new Database();

countNodes(db.tree.root);
console.log('Total nodes: ', countDraw + countRedWins + countYellowWins + countNonTerminalNodes);
console.log('Non terminal nodes: ', countNonTerminalNodes);
console.log('RED_WINS: ', countRedWins);
console.log('YELLOW_WINS: ', countYellowWins);
console.log('DRAW: ', countDraw);

const board = new GameNode(null);



