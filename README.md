# Connect Four

A Connect Four game written in Angular. 

You can play it [here](https://connectfour.codecritique.org) and read an article about it [here](https://blog.codecritique.org/?p=203). 

## Install requirements 

* Angular
* [Deepstream Server](https://deepstreamhub.com/open-source/?io)

## Launch app

First install project dependencies. 

    npm install

Deepstream is an external dependency which is currently freely available to download, as a binary. Visit deepstream.io. After installing Deepstream, start the realtime server. 

    /usr/local/bin/deepstream

Now we can build and launch the app.
    
    ng serve


## Execute e2e tests

First let's install Protractor.

    npm install -g protractor

This will install two command line tools, protractor and webdriver-manager. Try running ```protractor --version``` to make sure it's working.

The webdriver-manager is a helper tool to easily get an instance of a Selenium Server running. Use it to download the necessary binaries with:	

``` 
webdriver-manager update
```

Note: if the previous command fails to upgrade webdriver to the current version of Chrome installed on your machine, try passing a specific version param: 

```
webdriver-manager update --versions.chrome=79.0.3945.117
``` 	

Start Deepstream server and launch the Angular app. 

Finally, to run the e2e tests, execute:

    protractor e2e/protractor-ci.conf.js 

## Debug e2e tests in Chrome

    node --inspect-brk ~/.node_modules_global/bin/protractor e2e/protractor.conf.js --specs e2e/src/home.e2e-spec.ts 

Then open Chrome browser and go to `chrome://inspect/#devices`
