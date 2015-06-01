HandyDevServer
===================
A simple web server with handy hooks for setting up test environments for web development.
###Installation &nbsp;  [![npm version](https://badge.fury.io/js/handydevserver.svg)](http://badge.fury.io/js/handydevserver)
```sh
npm install handydevserver
```
###Simple Usage
Call the constructor with a port to run on, and an array of folders to look for files in.
```javascript
var handydevserver = require("handydevserver");
// Add three folders to the common directory.
// Run on port 8080
handydevserver(8080, ['./dist', './smoketest', './gateway'])
```
###Hooks
You can intercept text files (CSS, HTML, JS, etc) before they get delivered to the browser incase you want to change them. To do this, pass a config object to your call to the constructor:
```javascript
handydevserver(
    8080,
   ['./dist', './smoketest', './gateway'],
    {
      ontextfile: function (filename, contents) {
        if (filename.indexOf('gateway.js') || filename.indexOf('gateway.min.js')) {
          contents = contents.replace(/foo/gi, "bar");
        }
        return contents;
      }
    });
```

