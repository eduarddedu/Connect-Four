import { browser, by, ProtractorBrowser, ElementFinder } from 'protractor';
import { signIn, signOut } from './actions';

describe('PanelPlayers', () => {
    const browserJohn: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browserJane: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        await signIn(browser, 'Spectator');
        await signIn(browserJohn, 'John');
        await signIn(browserJane, 'Jane');
    });

    it('should show all online users (order cannot be asserted)', async () => {
        panelRows(browser).then(rows => {
            expect(rows.length).toEqual(2);
            expect(username(rows[0])).toMatch(/Jane|John/);
            expect(username(rows[1])).toMatch(/Jane|John/);
        });
        await signOut(browser);
        await signOut(browserJohn);
        await signOut(browserJane);
    });


    it('should update when a user goes offline', async () => {
        await signOut(browserJohn);
        panelRows(browser).then(rows => {
            expect(rows.length).toEqual(1);
            expect(username(rows[0])).toEqual('Jane');
        });
        await signOut(browserJane);
        await signOut(browser);
    });

    function panelRows(browserInstance: ProtractorBrowser) {
        return browserInstance.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
    }

    async function username(row: ElementFinder): Promise<string> {
        return await row.all(by.css('.c4-card-row-item')).first().getText();
    }

});



