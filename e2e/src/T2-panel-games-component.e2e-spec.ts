import { browser, element, by, ProtractorBrowser } from 'protractor';

import { signIn, signOut, startAiGame } from './actions';
import { assertNoBrowserError } from './assertions';

describe('PanelGames', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);
    const browser3: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        await signIn(browser, 'User');
        await signIn(browser2, 'User2');
        await signIn(browser3, 'User3');
    });

    afterEach(() => {
        assertNoBrowserError(browser);
        assertNoBrowserError(browser2);
        assertNoBrowserError(browser3);
    });

    it('should show ongoing games', async () => {
        await startAiGame(browser2);
        await startAiGame(browser3);
        const list = element(by.css('#panelGames>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(async rows => {
            expect(rows.length).toEqual(2);
            await signOut(browser);
            await signOut(browser2);
            await signOut(browser3);
        });
    });
});
