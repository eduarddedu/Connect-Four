
export class Game {
  firstColor: string;
  secondColor: string;
  current: string;
  service: any;

  constructor(firstColor: string, secondColor: string) {
    this.firstColor = firstColor;
    this.secondColor = secondColor;
    this.current = firstColor;

  }

  next() {
    this.current = this.current === this.firstColor ? this.secondColor : this.firstColor;
    return this;
  }

  get currentColor() {
    return this.current;
  }
}
