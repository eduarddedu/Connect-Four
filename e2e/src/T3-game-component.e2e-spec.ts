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

    it('should display correct message on each turn and on win (game watcher perspective)', async () => {
        // convenience methods
        function getTurnInfoMessage() {
            return element(by.css('#turnInfo')).getText();
        }
        function getGameOverMessage() {
            return element(by.css('#gameOverMessage')).getText();
        }
        function browser3Move(id: number) {
            move(browser3, id);
        }
        function browser2Move(id: number) {
            move(browser2, id);
        }
        function move(browserInstance: ProtractorBrowser, id: number) {
            browserInstance.element(by.css(`input[name="${id}"]`)).click();
        }

        // let's play a game between User2 and User3
        const list = browser2.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(async rows => {
            expect(rows.length).toEqual(2);
            await rows[0].click();
            browser2.sleep(200); // wait until user3 browser shows the invitation
            const button = browser3.element(by.buttonText('Join Game'));
            browser.wait(button.isPresent(), 5000);
            await button.click();
            // User1 joins game as watcher
            const game = element(by.css('#panelGames>.c4-card-body>.c4-card-row'));
            await game.click();
            // User1 should see initial message
            expect(getTurnInfoMessage()).toEqual('Waiting for User3...');
            // User3 moves
            browser3Move(67);
            // User1 should see next turn message
            expect(getTurnInfoMessage()).toEqual('Waiting for User2...');
            // let's continue moving until user3 wins
            [66, 57, 56, 47, 46, 37, 36, 27].forEach((value, index) => {
                if (index % 2 === 0) {
                    browser2Move(value);
                } else {
                    browser3Move(value);
                }
            });
            expect(getGameOverMessage()).toMatch('User3 wins');
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
