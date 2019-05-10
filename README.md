## Run e2e tests

First execute: 
```
webdriver-manager update
```
Then from another terminal 
```
npm run serve
```
Finally from another terminal:
```
protractor e2e/protractor-ci.conf.js 
```

Or debug e2e tests in Chrome

 ```
node --inspect-brk ~/.node_modules_global/bin/protractor e2e/protractor.conf.js --specs e2e/src/home.e2e-spec.ts 
 ```

 Then open Chrome browser and type 

 ```
 chrome://inspect/#devices
 ```

