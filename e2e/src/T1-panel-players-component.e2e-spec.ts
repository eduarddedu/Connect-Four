import { browser, by, ProtractorBrowser, ElementFinder } from 'protractor';
import { signIn, signOut, startGameBetweenUsers, sendGameInvitation, acceptGameInvitation } from './actions';

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

    it('should see user status as "In game"', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        await panelRows(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            expect(status(rows[0])).toEqual('In game');
            expect(status(rows[1])).toEqual('In game');
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });

    it('should see user status as "Online" if user drops during game and reconnects (spectator perspective)', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        // John disconnects during game
        await signOut(browserJohn);
        // John comes back online
        await signIn(browserJohn, 'John');
        // verify status from Spectator's perspective
        await panelRows(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            expect(status(rows[0])).toEqual('Online');
            expect(status(rows[1])).toEqual('Online');
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });

    it('should see user status as "Online" if user drops during game and reconnects (player perspective)', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        // John disconnects during game
        await signOut(browserJohn);
        // John comes back online
        await signIn(browserJohn, 'John');
        // verify status from Jane's perspective
        await panelRows(browserJane).then(async rows => {
            expect(rows.length).toEqual(2);
            expect(status(rows[0])).toEqual('Online');
            expect(status(rows[1])).toEqual('Online');
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });

    it('should see "User is unavailable" alert', async () => {
        const invitationSent = await sendGameInvitation(browserJohn, 'Jane');
        expect(invitationSent).toBe(true);
        await signOut(browserJohn);
        await acceptGameInvitation(browserJane);
        const html = await browserJane.getPageSource();
        expect(html).toContain('John is not available');
        await signOut(browserJane);
        await signOut(browser);
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



