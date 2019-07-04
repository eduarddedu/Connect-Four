import { browser, by, ProtractorBrowser } from 'protractor';
import { signIn, signOut, startAiGame } from './actions';
import { assertGameStatusMessageEqualTo } from './assertions';

describe('Parallel sessions handling', () => {
    const browser_2: ProtractorBrowser = browser.forkNewDriverInstance(false);


    it('should make it impossible for users to be logged into the app from two devices, in parallel', async function () {
        await signIn(browser, 'Spectator');
        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/');
        await signIn(browser_2, 'Spectator');
        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/login');
        await signOut(browser_2);
    });

    it('should enable self_2 to join a game in progress initiated by self_1', async function () {
        await signIn(browser, 'Spectator');
        await startAiGame(browser);
        await signIn(browser_2, 'Spectator');
        expect(browser.getCurrentUrl()).toEqual('http://localhost:4200/login');
        assertGameStatusMessageEqualTo(browser_2, 'Your turn');
        await signOut(browser_2);
    });
});

