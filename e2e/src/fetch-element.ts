import { by, ProtractorBrowser } from 'protractor';

export function fetchPanelPlayersRows(browserInstance: ProtractorBrowser) {
    return browserInstance.element(by.css('#panelPlayers>.c4-card-body')).all(by.css('.c4-card-row'));
}
