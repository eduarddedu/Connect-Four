import { ProtractorBrowser, logging, by, ElementFinder } from 'protractor';

export async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
    const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
        level: logging.Level.SEVERE,
    } as logging.Entry));
}

export async function assertGameStatusIs(browserInstance: ProtractorBrowser, expectedStatus: string) {
    expect(await gameStatus(browserInstance)).toEqual(expectedStatus);
}

export async function assertPlayerNameIs(playerRow: ElementFinder, expectedName: string) {
   expect(await playerName(playerRow)).toEqual(expectedName);
}

export async function assertPlayerStatusIs(playerRow: ElementFinder, expectedStatus: string) {
    expect(await playerStatus(playerRow)).toEqual(expectedStatus);
}


// convenience methods
async function gameStatus(browserInstance: ProtractorBrowser) {
    return await browserInstance.element(by.id('gameStatus')).getText();
}

async function playerName(playerRow: ElementFinder): Promise<string> {
    return playerRow.all(by.css('.c4-card-row-item>span')).first().getText();
}

async function playerStatus(row: ElementFinder): Promise<string> {
    return row.all(by.css('.c4-card-row-item')).get(1).getText();
}
