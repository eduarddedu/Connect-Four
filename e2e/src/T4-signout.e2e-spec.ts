import { browser, ProtractorBrowser } from 'protractor';
import { signIn, signOut, startAiGame } from './actions';
import { assertGameStatusIs, assertPlayerStatusIs } from './assertions';
import { fetchPanelPlayersRows } from './fetch-element';
import { assertPlayerNameIs } from './assertions';

describe('Parallel sessions handling', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserSpectator: ProtractorBrowser = browser.forkNewDriverInstance(false);

    it('should make it impossible for users to be logged into the app from two devices, in parallel', async function () {
        await signIn(browserSpectator, 'Spectator');
        await signIn(browser, 'John');
        fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(1);
            assertPlayerNameIs(rows[0], 'John');
        });
        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/');

        await signIn(browserJohn, 'John');

        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/login');
        fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(1);
            assertPlayerNameIs(rows[0], 'John');
        });

        await signOut(browserJohn);
        await signOut(browserSpectator);
    });

    it('should enable self_2 to join a game in progress initiated by self_1', async function () {
        await signIn(browser, 'John');
        await signIn(browserSpectator, 'Spectator');
        fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(1);
            assertPlayerNameIs(rows[0], 'John');
        });
        await startAiGame(browser);
        await signIn(browserJohn, 'John');
        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/login');
        assertGameStatusIs(browserJohn, 'Your turn');
        await fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(1);
            assertPlayerNameIs(rows[0], 'John');
            assertPlayerStatusIs(rows[0], 'In game');
        });
        await signOut(browserJohn);
        await fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(0);
        });
        await signOut(browserSpectator);
        // a user that comes online now should see no players
        await signIn(browserSpectator, 'Spectator');
        await fetchPanelPlayersRows(browserSpectator).then(rows => {
            expect(rows.length).toBe(0);
        });
        await signOut(browserSpectator);
    });
});

