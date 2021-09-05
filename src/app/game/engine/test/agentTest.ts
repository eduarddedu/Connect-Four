import { Agent, GameNode, Color, State } from '../index';

let node = GameNode.rootNode(State.RED_MOVES);
const agent = new Agent(Color.RED);
node = agent.nextNode(node);
console.log(node.move);
