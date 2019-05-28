import { browser, element, by, ProtractorBrowser } from 'protractor';
import { signIn, signOut, startAiGame } from './actions';

describe('PanelGames', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browser3: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        browser.ignoreSynchronization = true;
        browser2.ignoreSynchronization = true;
        browser3.ignoreSynchronization = true;
        await signIn(browser, 'User1');
        await signIn(browser2, 'User2');
        await signIn(browser3, 'User3');
        await browser3.get('/');
        await browser2.get('/');
        await browser.get('/');
    });

    it('should show in progress games', async () => {
        await startAiGame(browser2);
        await startAiGame(browser3);
        const list = element(by.css('#panelGames>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(items => {
            expect(items.length).toEqual(2);
        });
        await signOut(browser);
        await signOut(browser2);
        await signOut(browser3);
    });
});
