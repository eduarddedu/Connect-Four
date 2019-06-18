import { browser, element, by, ProtractorBrowser } from 'protractor';

import { signIn, signOut, startGameBetweenUsers, quitGameDuringPlay, quitWatchingGame, quitGameOnGameEnd } from './actions';
import { assertNoBrowserError } from './assertions';


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
        expect(await statusMessage(browser)).toEqual('Waiting for Jane...');
        expect(await statusMessage(browserJane)).toEqual('Your turn');
        expect(await statusMessage(browserJohn)).toEqual('Waiting for Jane...');
    });

    it('should see correct status on second turn', async () => {
        await move(browserJane, 67);
        expect(await statusMessage(browser)).toEqual('Waiting for John...');
        expect(await statusMessage(browserJane)).toEqual('Waiting for John...');
        expect(await statusMessage(browserJohn)).toEqual('Your turn');
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
        expect(await statusMessage(browser)).toMatch('Game over');
        expect(await statusMessage(browserJohn)).toMatch('Game over');
        expect(await statusMessage(browserJane)).toMatch('Game over');
    });

    it('should show gameover modal to players', async () => {
        expect((await playAnotherRoundBtn(browserJane)).isPresent()).toBe(true);
        expect((await playAnotherRoundBtn(browserJohn)).isPresent()).toBe(true);
    });

    it('should correctly see a finished game', async () => {
        await quitWatchingGame(browser);
        await watchFirstGameInList(browser);
        expect(await statusMessage(browser)).toMatch('Game over');
    });

    it('should see correct status when game is on hold', async () => {
        await playAnotherRoundBtn(browserJane).click();
        expect(await statusMessage(browser)).toEqual('Waiting for players...');
        expect(await statusMessage(browserJohn)).toEqual('Waiting for players...');
        await playAnotherRoundBtn(browserJohn).click();
    });

    it('should see correct status on first turn (after game reset)', async () => {
        expect(await statusMessage(browser)).toEqual('Waiting for John...');
        expect(await statusMessage(browserJohn)).toEqual('Your turn');
        expect(await statusMessage(browserJane)).toEqual('Waiting for John...');
    });

    it('should see correct status on second turn (after game reset)', async () => {
        await move(browserJohn, 67);
        expect(await statusMessage(browser)).toEqual('Waiting for Jane...');
        expect(await statusMessage(browserJohn)).toEqual('Waiting for Jane...');
        expect(await statusMessage(browserJane)).toEqual('Your turn');
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

    it('should see game abandoned notification when player quits a finished game', async () => {
        await startGameBetweenUsers(browserJane, browserJohn, 'John');
        await watchFirstGameInList(browser);
        let index = 0;
        for (const id of [67, 66, 57, 56, 47, 46, 37]) {
            if (index % 2 === 0) {
                await move(browserJohn, id);
                browserJane.sleep(100);
            } else {
                await move(browserJane, id);
                browserJohn.sleep(100);
            }
            index++;
        }
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

    it('sign out', async () => {
        await signOut(browser);
        await signOut(browserJane);
        await signOut(browserJohn);
    });
});

// convenience methods
async function statusMessage(browserInstance: ProtractorBrowser) {
    return await browserInstance.element(by.id('gameStatus')).getText();
}

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
