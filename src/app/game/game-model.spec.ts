import { GameModel } from './game-model';
const matrix = [
    [11, 12, 13, 14, 15, 16, 17],
    [21, 22, 23, 24, 25, 26, 27],
    [31, 32, 33, 34, 35, 36, 37],
    [41, 42, 43, 44, 45, 46, 47],
    [51, 52, 53, 54, 55, 56, 57],
    [61, 62, 63, 64, 65, 66, 67]
];

describe('GameModel spec', () => {
    it('should return correct next move options 1', () => {
        const game = new GameModel(true, [64]);
        const nextMoveOptions = game.nextMoveOptions;
        let isCorrect = nextMoveOptions.length === 7;
        [61, 62, 63, 54, 65, 66, 67].forEach(id => {
            if (!nextMoveOptions.includes(id)) {
                isCorrect = false;
            }
        });
        expect(isCorrect).toBe(true);
    });

    it('should return correct next move options 2', () => {
        const game = new GameModel(true, [62, 63, 52, 53, 64]);
        const nextMoveOptions = game.nextMoveOptions;
        let isCorrect = nextMoveOptions.length === 7;
        [61, 42, 43, 54, 65, 66, 67].forEach(id => {
            if (!nextMoveOptions.includes(id)) {
                isCorrect = false;
            }
        });
        expect(isCorrect).toBe(true);
    });

    it('should detect game win 1', () => {
        const moves = [64, 54, 61, 63, 62, 53, 65, 52, 66, 51];
        const game = new GameModel(true, moves);
        expect(game.win).toBe(true);
    });

    it('should detect game win 2', () => {
        const moves = [];
        [61, 62, 63, 64, 65, 66, 67, 51, 52, 53, 54, 55, 56, 57, 41, 42, 43, 44, 45, 46, 47, 31]
            .forEach(id => moves.push(id));
        const game = new GameModel(true, moves);
        expect(game.win).toBe(true);
    });

    it('should detect game draw', () => {
        const moves = [];
        [61, 62, 63, 64, 65, 66, 67, 51, 52, 53, 54, 55, 56, 57, 41, 42, 43, 44, 45, 46, 47]
            .forEach(id => moves.push(id));
        [32, 33, 34, 35, 36, 37, 27, 26, 25, 24, 23, 22, 17, 16, 15, 14, 12, 31, 13, 21, 11]
            .forEach(id => moves.push(id));
        const game = new GameModel(true, moves);
        expect(game.draw).toBe(true);
    });


    it('should reach game win or game draw', () => {
        const game = new GameModel(true, []);
        while (true) {
            game.move(game.randomMove());
            if (game.win || game.draw) {
                break;
            }
        }
    });
});

