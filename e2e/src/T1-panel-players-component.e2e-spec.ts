import { browser, element, by, ProtractorBrowser } from 'protractor';
import { signIn, signOut } from './actions';

describe('PanelPlayers', () => {
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
        await browser.get('/'); // actually we cannot control which browser gets '/' first
    });

    it('should show online users - entry order cannot be tested', async () => {
        const list = element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(items => {
            expect(items.length).toEqual(2);
            let name = items[0].element(by.css('.c4-card-row-item')).getText();
            expect(name).toMatch('User(3|2)');
            name = items[1].element(by.css('.c4-card-row-item')).getText();
            expect(name).toMatch('User(3|2)');
        });
        await signOut(browser);
        await signOut(browser2);
        await signOut(browser3);
    });


    it('should update when a user goes offline', async () => {
        await signOut(browser2);
        const list = element(by.css('#panelPlayers')).element(by.css('.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(items => {
            expect(items.length).toEqual(1);
            const name = items[0].element(by.css('.c4-card-row-item')).getText();
            expect(name).toEqual('User3');
        });
        await signOut(browser3);
        await signOut(browser);
    });

});
