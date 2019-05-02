## Run e2e tests

```
npm run serve
```

From another terminal execute: 

```
webdriver-manager update
webdriver-manager start
```

And from yet another terminal:

```
protractor e2e/protractor-ci.conf.js 
```

## Debug e2e tests in Chrome

 ```
node --inspect-brk ~/.node_modules_global/bin/protractor e2e/protractor-ci.conf.js
 ```

