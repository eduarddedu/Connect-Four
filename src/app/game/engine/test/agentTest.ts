import { Agent } from '../index';
import { GameNode } from '../index';

let node = new GameNode(null);
const agent = new Agent();
node = agent.move(node);
console.log(node.move);
