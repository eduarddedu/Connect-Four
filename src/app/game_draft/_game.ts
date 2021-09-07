import { Injectable } from '@angular/core';

import { RangeX, RangeY, Color, Move, GameNode, State, Agent } from '../game/engine';
import { User } from '../util/models';
import { GameContext } from './_gameContext';

@Injectable({
  providedIn: 'root'
})
export class Game {
  public readonly initialState: State.RED_MOVES | State.YELLOW_MOVES;
  private node: GameNode;
  private agent: Agent;
  private context: GameContext;


  constructor(ctx: GameContext) {
    this.initialState = ctx.initialState;
    this.node = GameNode.rootNode(this.initialState);
   /*  // Object.assign(this, data);
    this.user = user;
    // this.id = data.id;
    this.startDate = new Date(data.startDate);
    this.players = data.players;
    // this.state = data.state;
    this.points = data.points;
    this.winner = data.winner;
    // this.redMovesFirst = data.redMovesFirst;
    this.moves = data.moves;
    const ids = [this.players.red.id, this.players.yellow.id];
    this.isAgainstAi = ids.includes('0');
    this.ourUserPlays = ids.includes(user.id);
    this.opponent = this.players.red.id === user.id ? this.players.yellow : this.players.red;
    this._initialState = data.redMovesFirst ? State.RED_MOVES : State.YELLOW_MOVES;
    this._node = GameNode.rootNode(this._initialState);
    if (this.isAgainstAi) {
      const aiPlaysRed = this.players.red.id === '0';
      const agentColor = aiPlaysRed ? Color.RED : Color.YELLOW;
      this.agent = new Agent(this._node);
    }
    this.updateStatus(); */
  }

  get state() {
    return this.node.state;
  }

  takeMove(move: Move) {
    // const move = this.moveIdToMove(+moveId);
    this.node = this.node.childNode(move);
    // this.checkGame();
  }

  reset() {
    /* const data = {
      moves: [],
      state: 'in progress',
      redMovesFirst: this.winner ? this.winner.id === this.players.yellow.id : true,
      winner: undefined
    };
    Object.assign(this, data);
    this.updateStatus();
    this._node = GameNode.rootNode(this.initialState);
    this.agent = new Agent(this._node); */
  }

  updateStatus() {
    const firstName = (str: string) => str.replace(/ .*/, '');
    switch (this.state) {
      case State.DRAW:
      case State.RED_WINS:
      case State.YELLOW_WINS:
        // this.status = `Game over`;
        break;
    }
  }

  nextBestMove() {
    // return this.moveToMoveId(this.agent.move());
  }

  /* private checkGame() {
    if (this._node.state === State.RED_WINS || this._node.state === State.YELLOW_WINS || this._node.state === State.DRAW) {
      // this.state = 'over';
    }
    if (this._node.state === State.RED_WINS || this._node.state === State.YELLOW_WINS) {
      this.winner = this._node.state === State.RED_WINS ? this.players.red : this.players.yellow;
      if (this.winner.id === this.players.red.id) {
        this.points.red += 1;
      } else {
        this.points.yellow += 1;
      }
    }
    this.updateStatus();
  }

  private moveIdToMove(moveId: number) {
    const color = this.moves.length % 2 === 1 ? Color.RED : Color.YELLOW;
    const x = (moveId % 10) - 1;
    const y = Math.abs(Math.floor(moveId / 10) - 6);
    return new Move(<RangeX>x, <RangeY>y, color);
  }

  private moveToMoveId(move: Move) {
    const _x = move.x + 1;
    const _y = Math.abs(move.y - 6) * 10;
    const moveId = _x + _y;
    return moveId.toString();
  } */

}
