import { browser, by, ProtractorBrowser } from 'protractor';

import { signIn, signOut, startAiGame, startGameBetweenUsers, quitGameDuringPlay, quitWatchingGame, quitGameOnGameEnd } from './actions';
import { assertNoBrowserError, assertGameStatusIs, assertWinnerNameIs } from './assertions';


describe('GameComponent', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserJane: ProtractorBrowser = browser.forkNewDriverInstance(false);

    afterEach(() => {
        assertNoBrowserError(browser);
        assertNoBrowserError(browserJohn);
        assertNoBrowserError(browserJane);
    });

    it('should setup the game', async () => {
        await signIn(browser, 'Spectator');
        await signIn(browserJohn, 'John');
        await signIn(browserJane, 'Jane');
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        await watchFirstGameInList(browser);
    });

    it('should see correct status on first turn', async () => {
        assertGameStatusIs(browser, 'Waiting on Jane...');
        assertGameStatusIs(browserJane, 'Your turn');
        assertGameStatusIs(browserJohn, 'Waiting on Jane...');
    });

    it('should see correct status on second turn', async () => {
        await move(browserJane, 67);
        assertGameStatusIs(browser, 'Waiting on John...');
        assertGameStatusIs(browserJane, 'Waiting on John...');
        assertGameStatusIs(browserJohn, 'Your turn');
    });

    it('should see correct status on game end', async () => {
        let index = 0;
        for (const id of [66, 57, 56, 47, 46, 37]) {
            if (index % 2 === 0) {
                await move(browserJohn, id);
                browserJane.sleep(100);
            } else {
                await move(browserJane, id);
                browserJohn.sleep(100);
            }
            index++;
        }
        assertGameStatusIs(browser, 'Game over');
        assertGameStatusIs(browserJohn, 'Game over');
        assertGameStatusIs(browserJane, 'Game over');
    });

    it('should see correct game winner - (1)', async () => {
        browser.sleep(1000);
        assertWinnerNameIs(browserJane, 'Jane');
        assertWinnerNameIs(browserJohn, 'Jane');
        expect((await playAnotherRoundBtn(browserJane)).isPresent()).toBe(true);
        expect((await playAnotherRoundBtn(browserJohn)).isPresent()).toBe(true);
    });

    it('should correctly join and see a finished game', async () => {
        await quitWatchingGame(browser);
        await watchFirstGameInList(browser);
        assertGameStatusIs(browser, 'Game over');
    });

    it('should see correct status when game is on hold', async () => {
        await playAnotherRoundBtn(browserJane).click();
        assertGameStatusIs(browser, 'Waiting on second player...');
        assertGameStatusIs(browserJohn, 'Waiting on second player...');
        await playAnotherRoundBtn(browserJohn).click();
    });

    it('should see correct status on first turn', async () => {
        assertGameStatusIs(browser, 'Waiting on John...');
        assertGameStatusIs(browserJohn, 'Your turn');
        assertGameStatusIs(browserJane, 'Waiting on John...');
    });

    it('should see correct status on second turn', async () => {
        await move(browserJohn, 64);
        assertGameStatusIs(browser, 'Waiting on Jane...');
        assertGameStatusIs(browserJohn, 'Waiting on Jane...');
        assertGameStatusIs(browserJane, 'Your turn');
        await move(browserJane, 65);
    });

    it('should be able to quit watching a game without getting errors', async () => {
        await quitWatchingGame(browser);
    });

    it('should see "Game ended in a draw"', async () => {
        const moves = [].concat(
            [63, 62, 55, 54, 45, 35, 44, 66, 56, 46, 34, 67, 24, 14, 52, 42, 32, 25, 15, 36],
            [26, 22, 61, 12, 51, 41, 16, 31, 21, 11, 53, 43, 33, 23, 13, 57, 47, 37, 27, 17]);
        let index = 0;
        for (const id of moves) {
            if (index % 2 === 0) {
                await move(browserJohn, id);
                browserJane.sleep(100);
            } else {
                await move(browserJane, id);
                browserJohn.sleep(100);
            }
            index++;
        }
        assertGameStatusIs(browserJane, 'Game over');
        assertGameStatusIs(browserJohn, 'Game over');
        expect(browserJane.getPageSource()).toContain('Game ended in a draw');
        expect(browserJohn.getPageSource()).toContain('Game ended in a draw');
        await playAnotherRoundBtn(browserJane).click();
        await playAnotherRoundBtn(browserJohn).click();
    });



    it('should see game abandoned notification when player quits a game in progress', async () => {
        await watchFirstGameInList(browser);
        await quitGameDuringPlay(browserJane);
        expect(browserJohn.getPageSource()).toContain('Game abandoned by player');
        expect(browser.getPageSource()).toContain('Game abandoned by player');
    });

    it('should see correct game winner - (2)', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        await watchFirstGameInList(browser);
        let index = 0;
        for (const id of [61, 62, 51, 52, 41, 42, 67, 32]) {
            if (index % 2 === 0) {
                await move(browserJane, id);
                browserJohn.sleep(100);
            } else {
                await move(browserJohn, id);
                browserJane.sleep(100);
            }
            index++;
        }
        browser.sleep(1000);
        assertWinnerNameIs(browserJane, 'John');
        assertWinnerNameIs(browserJohn, 'John');
        expect((await playAnotherRoundBtn(browserJane)).isPresent()).toBe(true);
        expect((await playAnotherRoundBtn(browserJohn)).isPresent()).toBe(true);
    });

    it('should see game abandoned notification when player quits a finished game', async () => {
        await quitGameOnGameEnd(browserJohn);
        let html = await browserJane.getPageSource();
        expect(html).toContain('Game abandoned by player');
        html = await browser.getPageSource();
        expect(html).toContain('Game abandoned by player');
        await quitGameOnGameEnd(browserJane);
    });

    it('should see game abandoned notification when player quits by signing out during game', async () => {
        await startGameBetweenUsers(browserJane, browserJohn, 'John');
        await watchFirstGameInList(browser);
        await signOut(browserJohn);
        let html = await browserJane.getPageSource();
        expect(html).toContain('Game abandoned by player');
        html = await browser.getPageSource();
        expect(html).toContain('Game abandoned by player');
        await signIn(browserJohn, 'John');
    });

    it('should see correct status during AI game', async () => {
        await startAiGame(browserJane);
        await watchFirstGameInList(browser);
        assertGameStatusIs(browser, 'Waiting on Jane...');
        assertGameStatusIs(browserJane, 'Your turn');
        [67, 66, 57, 47].forEach(async id => {
            browser.sleep(1100);
            await move(browserJane, id);
        });
        browser.sleep(1100);
        assertGameStatusIs(browser, 'Game over');
    });

    it('should see correct status during AI game - after game reset', async () => {
        const restartGameButton = browserJane.element(by.css('button.btn-success'));
        await restartGameButton.click();
        assertGameStatusIs(browser, 'Waiting on Jane...');
        assertGameStatusIs(browserJane, 'Your turn');
    });

    it('sign out', async () => {
        await signOut(browser);
        await signOut(browserJane);
        await signOut(browserJohn);
    });
});

// convenience methods

async function move(browserInstance: ProtractorBrowser, id: number) {
    await browserInstance.element(by.css(`input[name="${id}"]`)).click();
}

function playAnotherRoundBtn(browserInstance: ProtractorBrowser) {
    return browserInstance.element(by.buttonText('Play another round'));
}

async function watchFirstGameInList(browserInstance: ProtractorBrowser) {
    const game = browserInstance.element(by.css('#panelGames>.c4-card-body>.c4-card-row'));
    await game.click();
}
