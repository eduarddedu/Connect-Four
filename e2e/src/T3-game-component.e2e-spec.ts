import { browser, by, ProtractorBrowser } from 'protractor';

import { signIn, signOut, startAiGame, startGameBetweenUsers, quitGameDuringPlay, quitWatchingGame, quitGameOnGameEnd } from './actions';
import { assertNoBrowserError, assertGameStatusMessageEqualTo as assertGameStatusMessageToEqual } from './assertions';


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
        assertGameStatusMessageToEqual(browser, 'Waiting on Jane...');
        assertGameStatusMessageToEqual(browserJane, 'Your turn');
        assertGameStatusMessageToEqual(browserJohn, 'Waiting on Jane...');
    });

    it('should see correct status on second turn', async () => {
        await move(browserJane, 67);
        assertGameStatusMessageToEqual(browser, 'Waiting on John...');
        assertGameStatusMessageToEqual(browserJane, 'Waiting on John...');
        assertGameStatusMessageToEqual(browserJohn, 'Your turn');
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
        assertGameStatusMessageToEqual(browser, 'Game over');
        assertGameStatusMessageToEqual(browserJohn, 'Game over');
        assertGameStatusMessageToEqual(browserJane, 'Game over');
    });

    it('should see correct game winner - (1)', async () => {
        browser.sleep(1000);
        let text = await browserJane.element(by.css('#winnername')).getText();
        expect(text).toContain('Jane');
        text = await browserJohn.element(by.css('#winnername')).getText();
        expect(text).toContain('Jane');
        expect((await playAnotherRoundBtn(browserJane)).isPresent()).toBe(true);
        expect((await playAnotherRoundBtn(browserJohn)).isPresent()).toBe(true);
    });

    it('should correctly join and see a finished game', async () => {
        await quitWatchingGame(browser);
        await watchFirstGameInList(browser);
        assertGameStatusMessageToEqual(browser, 'Game over');
    });

    it('should see correct status when game is on hold', async () => {
        await playAnotherRoundBtn(browserJane).click();
        assertGameStatusMessageToEqual(browser, 'Waiting on second player...');
        assertGameStatusMessageToEqual(browserJohn, 'Waiting on second player...');
        await playAnotherRoundBtn(browserJohn).click();
    });

    it('should see correct status on first turn', async () => {
        assertGameStatusMessageToEqual(browser, 'Waiting on John...');
        assertGameStatusMessageToEqual(browserJohn, 'Your turn');
        assertGameStatusMessageToEqual(browserJane, 'Waiting on John...');
    });

    it('should see correct status on second turn', async () => {
        await move(browserJohn, 67);
        assertGameStatusMessageToEqual(browser, 'Waiting on Jane...');
        assertGameStatusMessageToEqual(browserJohn, 'Waiting on Jane...');
        assertGameStatusMessageToEqual(browserJane, 'Your turn');
    });

    it('should be able to quit watching a game without getting errors', async () => {
        await quitWatchingGame(browser);
        await move(browserJane, 66);
    });

    it('should see game abandoned notification when player quits a game in progress', async () => {
        await watchFirstGameInList(browser);
        await quitGameDuringPlay(browserJane);
        let html = await browserJohn.getPageSource();
        expect(html).toContain('Game abandoned by player');
        html = await browser.getPageSource();
        expect(html).toContain('Game abandoned by player');
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
        let text = await browserJane.element(by.css('#winnername')).getText();
        expect(text).toContain('John');
        text = await browserJohn.element(by.css('#winnername')).getText();
        expect(text).toContain('John');
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
        assertGameStatusMessageToEqual(browser, 'Waiting on Jane...');
        assertGameStatusMessageToEqual(browserJane, 'Your turn');
        [67, 66, 57, 47].forEach(async id => {
            browser.sleep(1100);
            await move(browserJane, id);
        });
        browser.sleep(1100);
        assertGameStatusMessageToEqual(browser, 'Game over');
    });

    it('should see correct status during AI game - after game reset', async () => {
        const restartGameButton = browserJane.element(by.css('button.btn-success'));
        await restartGameButton.click();
        assertGameStatusMessageToEqual(browser, 'Waiting on Jane...');
        assertGameStatusMessageToEqual(browserJane, 'Your turn');
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
