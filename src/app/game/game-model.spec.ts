import { GameModel } from './game-model';

it('should detect game over state', () => {
    const moves = [64, 54, 61, 63, 62, 53, 65, 52, 66, 51].map(e => `${e}`);
    const model = new GameModel(true, moves);
    expect(model.gameover);
});
