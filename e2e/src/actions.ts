import { by, ProtractorBrowser } from 'protractor';

export async function signIn(browserInstance: ProtractorBrowser, username: string) {
    await browserInstance.get('/login');
    const id = Math.floor(Math.random() * 1000000);
    await browserInstance.executeScript(function () {
        const uid = arguments[0];
        const name = arguments[1];
        localStorage.setItem('id', uid);
        localStorage.setItem('username', name);
    }, id, username);
    await browserInstance.get('/');
}

export async function signOut(browserInstance: ProtractorBrowser) {
    const profileIcon = browserInstance.element(by.id('icon'));
    await profileIcon.click();
    const signoutButton = browserInstance.element(by.id('signout-btn'));
    await signoutButton.click();
}

export async function startAiGame(browserInstance: ProtractorBrowser) {
    const row = browserInstance.element(by.css('#AiPanel>.c4-card-body>.c4-card-row'));
    await row.click();
}

export async function startGameBetweenUsers(
    browserInvitor: ProtractorBrowser, browserInvitee: ProtractorBrowser, usernameInvitee: string): Promise<any> {
    return new Promise(resolve => {
        const list = browserInvitor.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(async rows => {
            expect(rows.length).toBeGreaterThan(1);
            let userPresent = false;
            for (const row of rows) {
                const username = await row.all(by.css('.c4-card-row-item')).first().getText();
                if (username === usernameInvitee) {
                    userPresent = true;
                    await row.click();
                }
            }
            expect(userPresent).toBe(true);
            const button = browserInvitee.element(by.buttonText('Join Game'));
            await button.click();
            resolve();
        });
    });
}

export async function quitGameDuringPlay(browserInstance: ProtractorBrowser) {
    const homeButton = browserInstance.element(by.css('.brand'));
    expect(homeButton.isPresent()).toBe(true);
    await homeButton.click();
    const modalClose = browserInstance.element(by.buttonText('Quit Game'));
    expect(modalClose.isPresent()).toBe(true);
    await modalClose.click();
}

export async function quitGameOnGameEnd(browserInstance: ProtractorBrowser) {
    const modalCloseButton = browserInstance.element(by.buttonText('Quit Game'));
    expect(modalCloseButton.isPresent()).toBe(true);
    await modalCloseButton.click();
}

export async function quitWatchingGame(browserInstance: ProtractorBrowser) {
    const homeButton = browserInstance.element(by.css('.brand'));
    expect(homeButton.isPresent()).toBe(true);
    await homeButton.click();
}



