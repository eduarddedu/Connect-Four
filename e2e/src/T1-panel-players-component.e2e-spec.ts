import { browser, by, ProtractorBrowser, ElementFinder } from 'protractor';
import { signIn, signOut, startGameBetweenUsers } from './actions';

describe('PanelPlayers', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserJane: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        await signIn(browser, 'Spectator');
        await signIn(browserJohn, 'John');
        await signIn(browserJane, 'Jane');
    });

    it('should show online users in correct order: last-online-first-in-list', async () => {
        panelRows(browser).then(rows => {
            expect(rows.length).toEqual(2);
            expect(username(rows[0])).toEqual('Jane');
            expect(username(rows[1])).toEqual('John');
        });
        panelRows(browserJohn).then(rows => {
            expect(rows.length).toEqual(2);
            expect(username(rows[0])).toEqual('Jane');
            expect(username(rows[1])).toEqual('Spectator');
        });
        panelRows(browserJane).then(rows => {
            expect(rows.length).toEqual(2);
            expect(username(rows[0])).toEqual('John');
            expect(username(rows[1])).toEqual('Spectator');
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });

    it('should remove user when they go offline', async () => {
        await signOut(browserJohn);
        panelRows(browser).then(rows => {
            expect(rows.length).toEqual(1);
            expect(username(rows[0])).toEqual('Jane');
        });
        await signOut(browserJane);
        await signOut(browser);
    });

    it('should show user status - in game and not disturb user', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        panelRows(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            expect(status(rows[0])).toEqual('In game');
            expect(status(rows[1])).toEqual('In game');
            await rows[0].click();
            expect(status(rows[0])).toEqual('In game');
            await signOut(browser);
            await signOut(browserJohn);
            await signOut(browserJane);
        });
    });

    function panelRows(browserInstance: ProtractorBrowser) {
        return browserInstance.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
    }

    async function username(row: ElementFinder): Promise<string> {
        return await row.all(by.css('.c4-card-row-item>span')).first().getText();
    }

    async function status(row: ElementFinder): Promise<string> {
        return await row.all(by.css('.c4-card-row-item')).get(1).getText();
    }

});



