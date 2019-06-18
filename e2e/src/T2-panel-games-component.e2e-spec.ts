import { browser, element, by, ProtractorBrowser, ElementFinder } from 'protractor';

import { signIn, signOut, startAiGame, quitGameDuringPlay, startGameBetweenUsers, quitGameOnGameEnd } from './actions';
import { assertNoBrowserError } from './assertions';

describe('PanelGames', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserJane: ProtractorBrowser = browser.forkNewDriverInstance(false);

    afterEach(() => {
        assertNoBrowserError(browser);
        assertNoBrowserError(browserJohn);
        assertNoBrowserError(browserJane);
    });

    it('should show ongoing games', async () => {
        await signIn(browser, 'Spectator');
        await signIn(browserJohn, 'John');
        await signIn(browserJane, 'Jane');
        await startAiGame(browserJohn);
        await startAiGame(browserJane);
        gamesList(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            expect(redPlayerName(rows[0])).toEqual('Jane');
            expect(redPlayerName(rows[1])).toEqual('John');
        });
    });

    it('should update when a game is removed', async () => {
        await quitGameDuringPlay(browserJohn);
        gamesList(browser).then(async rows => {
            expect(rows.length).toEqual(1);
            expect(redPlayerName(rows[0])).toEqual('Jane');
        });
        await quitGameDuringPlay(browserJane);
        expect(element(by.css('#panelGames>.c4-card-body>.placeholder')).isPresent()).toBe(true);
    });

    it('should update the score', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        let index = 0;
        for (const id of [67, 66, 57, 56, 47, 46, 37]) {
            if (index % 2 === 0) {
                await move(browserJane, id);
                browserJohn.sleep(100);
            } else {
                await move(browserJohn, id);
                browserJane.sleep(100);
            }
            index++;
        }
        gamesList(browser).then(async rows => {
            expect(rows.length).toEqual(1);
            expect(redPlayerName(rows[0])).toEqual('Jane');
            expect(yellowPlayerName(rows[0])).toEqual('John');
            expect(score(rows[0])).toEqual('1 - 0');
        });
        await quitGameOnGameEnd(browserJane);
        await quitGameOnGameEnd(browserJohn);
    });

    it('sign out', async () => {
        await signOut(browser);
        await signOut(browserJane);
        await signOut(browserJohn);
    });


    function gamesList(browserInstance: ProtractorBrowser) {
        return browserInstance.element(by.css('#panelGames>.c4-card-body')).all(by.css('.c4-card-row'));
    }

    async function redPlayerName(row: ElementFinder) {
        return await row.all(by.css('div')).first().getText();
    }

    async function yellowPlayerName(row: ElementFinder) {
        return await row.all(by.css('div')).get(2).getText();
    }

    async function score(row: ElementFinder) {
        return await row.all(by.css('div')).get(1).getText();
    }

    async function move(browserInstance: ProtractorBrowser, id: number) {
        await browserInstance.element(by.css(`input[name="${id}"]`)).click();
    }
});
