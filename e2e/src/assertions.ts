import { ProtractorBrowser, logging, by } from 'protractor';

export async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
    const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
        level: logging.Level.SEVERE,
    } as logging.Entry));
}

export async function assertGameStatusMessageEqualTo(browserInstance: ProtractorBrowser, expected: string) {
    expect(await statusMessage(browserInstance)).toEqual(expected);
}


// convenience methods
async function statusMessage(browserInstance: ProtractorBrowser) {
    return await browserInstance.element(by.id('gameStatus')).getText();
}
