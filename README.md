HandyDevServer
===================
A simple web server with handy hooks for setting up test environments for web development.
###Installation &nbsp;  [![npm version](https://badge.fury.io/js/handydevserver.svg)](http://badge.fury.io/js/handydevserver)
```sh
npm install handydevserver
```
###Simple Usage
```javascript
var handydevserver = require("handydevserver");
// Add three folders to the common directory.
// Run on port 8080
handydevserver(8080, ['./dist', './smoketest', './gateway'])
});
```

