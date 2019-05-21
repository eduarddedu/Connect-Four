# Connect Four

A Connect Four browser game. 

Please check a live demo for this [thingy](https://connectfour.codecritique.org). You can also read a review of the app on my [blog](https://blog.codecritique.org/?p=203). 

## Requirements 

* Angular

## Launch app
    npm install
    ng serve

## Execute e2e tests

Open a terminal window and execute: 
​    webdriver-manager update   
​    webdriver-manager start

In a second terminal execute: 

    npm run serve

Finally from another terminal execute:

    protractor e2e/protractor-ci.conf.js 

## Debug e2e tests in Chrome

    node --inspect-brk ~/.node_modules_global/bin/protractor e2e/protractor.conf.js --specs e2e/src/home.e2e-spec.ts 

Then open Chrome browser and go to `chrome://inspect/#devices`
