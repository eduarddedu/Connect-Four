import { by, ProtractorBrowser } from 'protractor';

export async function signIn(browserInstance: ProtractorBrowser, username: string) {
    await browserInstance.get('/login');
    let id: string;
    switch (username) {
        case 'Spectator': id = '1'; break;
        case 'John': id = '2'; break;
        case 'Jane': id = '3';
    }
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
    const createGameButton = browserInstance.element(by.css('button.btn-outline-success'));
    expect(createGameButton.isPresent()).toBe(true);
    await createGameButton.click();
}

export async function startGameBetweenUsers(browserInvitor: ProtractorBrowser, browserInvitee: ProtractorBrowser, usernameInvitee: string) {
    await sendGameInvitation(browserInvitor, usernameInvitee);
    await acceptGameInvitation(browserInvitee);
}

export function sendGameInvitation(browserInvitor: ProtractorBrowser, usernameInvitee: string): Promise<boolean> {
    return new Promise(resolve => {
        const list = browserInvitor.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
        list.then(async rows => {
            expect(rows.length).toBeGreaterThan(1);
            let userPresent = false;
            for (const row of rows) {
                const username = await row.all(by.css('.c4-card-row-item>span')).first().getText();
                if (username === usernameInvitee) {
                    userPresent = true;
                    await row.click();
                }
            }
            expect(userPresent).toBe(true);
            const inviteButton = browserInvitor.element(by.css('button.btn-outline-success'));
            expect(inviteButton.isPresent()).toBe(true);
            await inviteButton.click();
            resolve(true);
        });
    });
}

export async function acceptGameInvitation(browserInvitee: ProtractorBrowser) {
    const button = browserInvitee.element(by.css('button.btn-outline-success'));
    await button.click();
}

export async function quitGameDuringPlay(browserInstance: ProtractorBrowser) {
    const homeButton = browserInstance.element(by.css('.brand'));
    expect(homeButton.isPresent()).toBe(true);
    await homeButton.click();
    const modalClose = browserInstance.element(by.css('button.btn-outline-danger'));
    expect(modalClose.isPresent()).toBe(true);
    await modalClose.click();
}

export async function quitGameOnGameEnd(browserInstance: ProtractorBrowser) {
    const modalCloseButton = browserInstance.element(by.css('button#closeModal'));
    expect(modalCloseButton.isPresent()).toBe(true);
    await modalCloseButton.click();
}

export async function quitWatchingGame(browserInstance: ProtractorBrowser) {
    const homeButton = browserInstance.element(by.css('.brand'));
    expect(homeButton.isPresent()).toBe(true);
    await homeButton.click();
}



