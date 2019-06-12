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

    it('should display new game button on game end', async () => {
        expect((await newGameButton(browserJane)).isPresent()).toBe(true);
        expect((await newGameButton(browserJohn)).isPresent()).toBe(true);
    });

    it('should display new game invitation to the other player', async () => {
        const newGameBtn = await newGameButton(browserJane);
        await newGameBtn.click();
        browserJane.sleep(100);
        const acceptButton = await browserJohn.element(by.buttonText('Join Game'));
        expect(acceptButton.isPresent()).toBe(true);
        await acceptButton.click();
    });

    it('should display correct messages on first turn - after game reset ', async () => {
        expect(await turnMessage(browser)).toEqual('Waiting for John...');
        expect(await turnMessage(browserJohn)).toEqual('Your turn');
        expect(await turnMessage(browserJane)).toEqual('Waiting for John...');
    });

    it('should display correct message on second turn - after game reset', async () => {
        await move(browserJohn, 67);
        expect(await turnMessage(browser)).toEqual('Waiting for Jane...');
        expect(await turnMessage(browserJohn)).toEqual('Waiting for Jane...');
        expect(await turnMessage(browserJane)).toEqual('Your turn');
    });

    it('sign out', async () => {
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

function newGameButton(browserInstance: ProtractorBrowser) {
    return browserInstance.element(by.buttonText('New Game'));
}
