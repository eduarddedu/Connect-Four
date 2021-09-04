import { State } from '../src/types';
import { GameTree } from '../src/gametree';
import { GameNode } from '../src/gamenode';

function printNode(node: GameNode) {
    console.log('NODE');
    console.log(node);
}

function printTerminalNodes(node: GameNode) {
    if (node.state === State.DRAW || node.state === State.RED_WINS || node.state === State.YELLOW_WINS) {
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
    if (node.state === State.RED_WINS) {
        countRedWins++;
    } else if (node.state === State.YELLOW_WINS) {
        countYellowWins++;
    } else if (node.state === State.DRAW) {
        countDraw++;
    } else {
        countNonTerminalNodes++;
        for (const child of node.children) {
            countNodes(child);
        }
    }
}

const tree = new GameTree(null, 8);

countNodes(tree.root);
console.log('Total nodes: ', countDraw + countRedWins + countYellowWins + countNonTerminalNodes);
console.log('Transitory nodes: ', countNonTerminalNodes);
console.log('RED_WINS: ', countRedWins);
console.log('YELLOW_WINS: ', countYellowWins);
console.log('DRAW: ', countDraw);




