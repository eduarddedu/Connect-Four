const config = require('./protractor.conf').config;

config.capabilities = {
  browserName: 'chrome',
  chromeOptions: {
    args: ['--headless', '--no-sandbox']
  }
};

/* config.multiCapabilities = [{
  browserName: 'firefox', 
  'moz:firefoxOptions': {
    args: ['--headless'],
    binary: 'node_modules/protractor/node_modules/webdriver-manager/selenium/geckodriver-v0.24.0'
  }
}] */

exports.config = config;