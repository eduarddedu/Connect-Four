import { ProtractorBrowser, logging } from 'protractor';

export async function assertNoBrowserError(browserInstance: ProtractorBrowser) {
    const logs = await browserInstance.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
        level: logging.Level.SEVERE,
    } as logging.Entry));
}
