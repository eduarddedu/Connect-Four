import { browser, element, by, ProtractorBrowser } from 'protractor';

describe('PanelPlayers', () => {
    const browser2: ProtractorBrowser = browser.forkNewDriverInstance(false);

    beforeEach(async function () {
        browser.ignoreSynchronization = true;
        browser2.ignoreSynchronization = true;
        await browser.get('/login');
        browser.executeScript(() => {
            localStorage.setItem('id', '1');
            localStorage.setItem('username', 'Galapagogol');
        });
        await browser2.get('/login');
        browser2.executeScript(() => {
            localStorage.setItem('id', '2');
            localStorage.setItem('username', 'Eduard');
        });
        await browser2.get('/');
        await browser.get('/');
    });


    it('should display online players', async function () {
        element.all(by.css('tr')).then(rows => {
            expect(rows.length).toBe(2);
            rows[0].all(by.css('td')).then(cells => {
                expect(cells[0].getText()).toBe('Bobiță');
            });
            rows[1].all(by.css('td')).then(cells => {
                expect(cells[0].getText()).toBe('Eduard');
            });
        });
    });

    it('should update when player offline', async function () {
        await signoutUser(browser2);
        browser2.sleep(200);
        element.all(by.css('tr')).then(rows => expect(rows.length).toBe(1));
    });


    async function signoutUser(browserInstance: ProtractorBrowser) {
        const profileIcon = browserInstance.element(by.id('icon'));
        await profileIcon.click();
        const signoutButton = browserInstance.element(by.id('signout-btn'));
        browser.sleep(500);
        await signoutButton.click();
    }
});
