import { browser, element, by, ProtractorBrowser } from 'protractor';

import { signIn, signOut, startGameBetweenUsers } from './actions';
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
        const gameRow = element(by.css('#panelGames>.c4-card-body>.c4-card-row'));
        await gameRow.click(); // Spectator joins game
    });

    it('should display correct message on first turn', async () => {
        expect(await turnMessage(browser)).toEqual('Waiting for Jane...');
        expect(await turnMessage(browserJane)).toEqual('Your turn');
        expect(await turnMessage(browserJohn)).toEqual('Waiting for Jane...');
    });

    it('should display correct message on second turn', async () => {
        await move(browserJane, 67);
        expect(await turnMessage(browser)).toEqual('Waiting for John...');
        expect(await turnMessage(browserJane)).toEqual('Waiting for John...');
        expect(await turnMessage(browserJohn)).toEqual('Your turn');
    });

    it('should display correct message on game end', async () => {
        let index = 0;
        for (const id of [66, 57, 56, 47, 46, 37, 36, 27]) {
            if (index % 2 === 0) {
                await move(browserJohn, id);
                browserJane.sleep(100);
            } else {
                await move(browserJane, id);
                browserJohn.sleep(100);
            }
            index++;
        }
        expect(await gameOverMessage(browser)).toMatch('Jane wins');
        expect(await gameOverMessage(browserJohn)).toMatch('You lose');
        expect(await gameOverMessage(browserJane)).toMatch('You win');
    });

    it('should sign out', async () => {
        await signOut(browser);
        await signOut(browserJane);
        await signOut(browserJohn);
    });
});

// convenience methods
async function turnMessage(browserInstance: ProtractorBrowser) {
    return await browserInstance.element(by.id('turnMessage')).getText();
}
async function gameOverMessage(browserInstance: ProtractorBrowser) {
    return await browserInstance.element(by.id('gameOverMessage')).getText();
}
async function move(browserInstance: ProtractorBrowser, id: number) {
    await browserInstance.element(by.css(`input[name="${id}"]`)).click();
}


