Connect 4
=========

A browser implementation of the popular board game [Connect Four](https://en.wikipedia.org/wiki/Connect_Four). 


Requirements 
-------------
Connect4 uses the deepstream.io realtime server to connect and keep the two Javascript clients in sync, so head over to deepstream [website](https://deepstream.io/install/) and install the right version for your OS. 

Additionally you will need _npm_ to fetch packages used by the app and _webpack_
to compile all CSS and Javascript dependencies into a single bundle.js file, required by index.html. 


Instructions
-----------
- Install npm packages

        npm install
- Emit the bundle.js file 
 
        webpack
- Or even better, you can start the webpack-dev-server to serve static assets on _http://localhost:8080_. The development server watches for changes in your modules, automatically recompiles the bundle and reloads the page in your browser, mercifully sparing you zillions of clicks on refresh button.  

        npm start
- Start your local deepstream.io server
- Load index.html or [http://localhost:8080](http://localhost:8080) in two separate tabs in your browser
- Play Connect four against yourself. Or add a new feature, if you like. Pull requests are welcome.  
