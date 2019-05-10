import { browser, element, by, ProtractorBrowser, logging } from 'protractor';
import { signUserIn as signinUser, signUserOut as signoutUser } from './actions';

describe('HomeSpec', () => {
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

    it('should see game as watcher', async () => {
        let row = element.all(by.css('tr')).first();
        await row.click(); // Galapagogol starts a game against AI
        browser2.sleep(200);
        const panelGames = browser2.element.all(by.tagName('table')).get(1);
        row = panelGames.element(by.css('tr'));
        await row.click(); // Eduard watches the game
        browser2.sleep(200);
        const span = browser2.element(by.id('turnInfo'));
        expect(span.getText()).toEqual('Waiting for Galapagogol...');
    });

    it('should display message "Game over. Opponent quit"', async () => {
        let row = element.all(by.css('tr')).first();
        await row.click(); // Galapagogol starts a game against AI
        browser2.sleep(200);
        const panelGames = browser2.element.all(by.tagName('table')).get(1);
        row = panelGames.element(by.css('tr'));
        await row.click(); // Eduard watches the game with interest
        const homeButton = element(by.css('.brand'));
        await homeButton.click();
        browser.sleep(200);
        const confirmQuitButton = element(by.buttonText('Yes'));
        await confirmQuitButton.click(); // but Galapagogol abandons the game. How sad!
        browser2.sleep(200);
        const html = await browser2.getPageSource();
        expect(html).toContain('Game over. Opponent abandoned');
    });

    async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
        const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    }

});
