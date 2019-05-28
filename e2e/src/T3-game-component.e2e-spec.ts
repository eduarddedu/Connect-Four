import { browser, element, by, ProtractorBrowser, logging } from 'protractor';
import { signIn, signOut } from './actions';


describe('GameComponent', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browser3: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        browser.ignoreSynchronization = true;
        browser2.ignoreSynchronization = true;
        browser3.ignoreSynchronization = true;
        await signIn(browser, 'User1');
        await browser.get('/');
        await signIn(browser2, 'User2');
        await browser2.get('/');
        await signIn(browser3, 'User3');
        await browser3.get('/');
    });

    afterEach(() => {
        assertNoBrowserError(browser);
        assertNoBrowserError(browser2);
        assertNoBrowserError(browser3);
    });

    it('should display { Waiting for username... } message', async () => {
        // starts game between User2 and User3
        const list = browser2.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(async rows => {
            expect(rows.length).toEqual(2);
            await rows[0].click();
            const button = browser3.element(by.buttonText('Join Game'));
            await button.click();
            // User1 joins game as watcher
            const game = element(by.css('#panelGames>.c4-card-body>.c4-card-row'));
            await game.click();
            const message = element(by.css('#turnInfo')).getText();
            expect(message).toEqual('Waiting for User3...');
            await signOut(browser3);
            await signOut(browser);
            await signOut(browser2);
        });
    });

    async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
        const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    }

});
