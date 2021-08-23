import { RangeX, RangeY, Color } from './types';

export class Move {
    x: RangeX;
    y: RangeY;
    color: Color;
    constructor(x: RangeX, y: RangeY, color: Color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}
