import { browser, element, by, ProtractorBrowser, logging } from 'protractor';
import { signUserIn as signinUser, signUserOut as signoutUser } from './actions';

describe('GameComponent', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        browser.ignoreSynchronization = true;
        browser2.ignoreSynchronization = true;
        await signinUser(browser, 'Galapagogol');
        await signinUser(browser2, 'Eduard');
        await browser.get('/');
        await browser2.get('/');
    });

    afterEach(async function () {
        await signoutUser(browser);
        await signoutUser(browser2);
        await assertNoBrowserError(browser);
        await assertNoBrowserError(browser2);
    });

    it('should display "Waiting for {username}" and "Game abandoned" messages', async () => {
        // Galapagogol starts a game against AI
        let row = element.all(by.css('tr')).first();
        await row.click();
        // Eduard starts watching the game
        browser2.sleep(200);
        const panelGames = browser2.element.all(by.tagName('table')).get(1);
        row = panelGames.element(by.css('tr'));
        await row.click();
        browser2.sleep(200);
        // Eduard should see Waiting for Galapagogol message
        const span = browser2.element(by.id('turnInfo'));
        expect(span.getText()).toEqual('Waiting for Galapagogol...');
        // now Galapagogol abandons the game. How sad!
        const homeButton = element(by.css('.brand'));
        await homeButton.click();
        browser.sleep(200);
        const confirmNavigation = element(by.buttonText('Quit'));
        await confirmNavigation.click();
        // Eduard should see Game over message
        browser2.sleep(200);
        const html = await browser2.getPageSource();
        expect(html).toContain('Game abandoned by player');
    });

    async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
        const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    }

});
