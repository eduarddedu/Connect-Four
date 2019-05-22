# Connect Four

A Connect Four browser game. 

Please check a live demo for this [thingy](https://connectfour.codecritique.org). You can also read a review of the app on my [blog](https://blog.codecritique.org/?p=203). 

## Requirements 

* Angular
* [Deepstream Server](https://deepstreamhub.com/open-source/?io)

## Launch app

First install project dependencies. 

    npm install

If Deepstream server is also installed now you can launch the app. 

    npm run serve

To stop both Angular and Deepstream: 

    npm run kill

## Execute e2e tests

Use npm to install Protractor globally with: 

    npm install -g protractor

This will install two command line tools, protractor and webdriver-manager. Try running ```protractor --version``` to make sure it's working.

The webdriver-manager is a helper tool to easily get an instance of a Selenium Server running. Use it to download the necessary binaries with:	

``` 
webdriver-manager update
webdriver-manager start
```	

In a second terminal execute: 

    npm run serve

Finally from another terminal execute:

    protractor e2e/protractor-ci.conf.js 

## Debug e2e tests in Chrome

    node --inspect-brk ~/.node_modules_global/bin/protractor e2e/protractor.conf.js --specs e2e/src/home.e2e-spec.ts 

Then open Chrome browser and go to `chrome://inspect/#devices`
