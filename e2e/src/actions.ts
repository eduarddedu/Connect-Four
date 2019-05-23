import { by, ProtractorBrowser } from 'protractor';

export async function signUserIn(browserInstance: ProtractorBrowser, username: string) {
    await browserInstance.get('/login');
    const id = Math.floor(Math.random() * 1000000);
    await browserInstance.executeScript(function() {
        const uid = arguments[0];
        const name = arguments[1];
        localStorage.setItem('id', uid);
        localStorage.setItem('username', name);
    }, id, username);
}

export async function signUserOut(browserInstance: ProtractorBrowser) {
    const profileIcon = browserInstance.element(by.id('icon'));
    await profileIcon.click();
    const signoutButton = browserInstance.element(by.id('signout-btn'));
    await signoutButton.click();
}

