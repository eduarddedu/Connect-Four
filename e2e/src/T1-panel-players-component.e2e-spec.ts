import { browser, ProtractorBrowser } from 'protractor';
import { signIn, signOut, startGameBetweenUsers, sendGameInvitation, acceptGameInvitation } from './actions';
import { fetchPanelPlayersRows } from './fetch-element';
import { assertPlayerNameIs, assertPlayerStatusIs } from './assertions';

describe('PanelPlayers', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserJane: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        await signIn(browser, 'Spectator');
        await signIn(browserJohn, 'John');
        await signIn(browserJane, 'Jane');
    });

    it('should show online users in correct order: last-online-first-in-list', async () => {
        fetchPanelPlayersRows(browser).then(rows => {
            expect(rows.length).toEqual(2);
            assertPlayerNameIs(rows[0], 'Jane');
            assertPlayerNameIs(rows[1], 'John');
        });
        fetchPanelPlayersRows(browserJohn).then(rows => {
            expect(rows.length).toEqual(2);
            assertPlayerNameIs(rows[0], 'Jane');
            assertPlayerNameIs(rows[1], 'Spectator');
        });
        fetchPanelPlayersRows(browserJane).then(rows => {
            expect(rows.length).toEqual(2);
            assertPlayerNameIs(rows[0], 'John');
            assertPlayerNameIs(rows[1], 'Spectator');
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });

    it('should remove user when they go offline', async () => {
        await signOut(browserJohn);
        fetchPanelPlayersRows(browser).then(rows => {
            expect(rows.length).toEqual(1);
            assertPlayerNameIs(rows[0], 'Jane');
        });
        await signOut(browserJane);
        await signOut(browser);
    });

    it('should see user status as "In game"', async () => {
        await startGameBetweenUsers(browserJohn, browserJane, 'Jane');
        await fetchPanelPlayersRows(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            assertPlayerStatusIs(rows[0], 'In game');
            assertPlayerStatusIs(rows[1], 'In game');
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
        await fetchPanelPlayersRows(browser).then(async rows => {
            expect(rows.length).toEqual(2);
            assertPlayerStatusIs(rows[0], 'Online');
            assertPlayerStatusIs(rows[1], 'Online');
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
        await fetchPanelPlayersRows(browserJane).then(async rows => {
            expect(rows.length).toEqual(2);
            assertPlayerStatusIs(rows[0], 'Online');
            assertPlayerStatusIs(rows[1], 'Online');
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
});



