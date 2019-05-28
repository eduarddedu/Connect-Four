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



