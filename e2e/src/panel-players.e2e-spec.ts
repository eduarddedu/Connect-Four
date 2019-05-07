import { browser, element, by, ProtractorBrowser } from 'protractor';
import { signUserIn, signUserOut } from './actions';

/**
 * https://github.com/angular/angular/issues/11853
 * Our Angular application imports the deepstream.io-client-js library and opens a websocket connection.
 * Because of socket long polling, protractor.waitForAngular() stalls, which causes e2e tests to timeout.
 * The workaround is to disable browser synchronisation. Unfortunately this leads to flaky tests.
 */
describe('PanelPlayers', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        browser.ignoreSynchronization = true;
        browser2.ignoreSynchronization = true;
        await signUserIn(browser, 'Galapagogol');
        await signUserIn(browser2, 'Eduard');
        await browser2.get('/');
        await browser.get('/');
    });


    it('should display all online users', async function () {
        element.all(by.css('tr')).then(rows => {
            expect(rows.length).toBe(2);
            rows[0].all(by.css('td')).then(cells => {
                expect(cells[0].getText()).toBe('Bobiță');
            });
            rows[1].all(by.css('td')).then(cells => {
                expect(cells[0].getText()).toBe('Eduard');
            });
        });
        await signUserOut(browser);
        await signUserOut(browser2);
    });

    it('should update when a user goes offline', async function () {
        await signUserOut(browser2);
        browser2.sleep(200);
        element.all(by.css('tr')).then(rows => expect(rows.length).toBe(1));
        await signUserOut(browser);
    });

});
