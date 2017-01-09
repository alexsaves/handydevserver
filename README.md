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
###Simulated server delay
To simulate latency, add a ``latency`` attribute with a delay value (in ms):
```javascript
handydevserver(8080, ['./dist', './smoketest', './gateway'], {
    latency: 2500
})
```
If you want to randomize the latency, provide an array of two values and the latency will be randomized somewhere in between:
```javascript
handydevserver(8080, ['./dist', './smoketest', './gateway'], {
    latency: [500, 2500]
})
```
###Ignore files/folders
To remove certain files or folders for directory listings, add an ``ignore`` array of strings. These are wildcards, so if you specify the string "hello" it would ignore things like: "hello_world", "hello_america", etc:
```javascript
handydevserver(8080, ['./dist', './smoketest', './gateway'], {
    ignore: ['node_modules', '.svn']
})
```
###Hooks
You can intercept text files (CSS, HTML, JS, etc) before they get delivered to the browser incase you want to change them. To do this, pass a config object to your call to the constructor:
```javascript
handydevserver(
    8080,
   ['./dist', './smoketest', './gateway'],
    {
      ontextfile: function (filename, contents, headers) {
        if (filename.indexOf('gateway.js') || filename.indexOf('gateway.min.js')) {
          contents = contents.replace(/foo/gi, "bar");
        }
        // Add some header
        headers.myHeader = 'some header value';
        return contents;
      },
      onhtmlfile: function(filename, contents, headers) {
        // an HTML file is being served
        // Do whatever changes you want
        return contents;
      },
      onjsfile: function(filename, contents, headers) {
        // a JavaScript file is being served
        // Do whatever changes you want
        return contents;
      }
    });
```
###Custom Headers
You can add your own custom headers to responses by adding a ``headers`` object to your configuration:
```javascript
handydevserver(
    8080,
   ['./dist', './smoketest', './gateway'],
    {
      headers: {'mycustomheader':'somevalue'}
    });
```
###SSL
You can also run an HTTPS server by using the self-signed cert feature. Note: you will need to add an exception to any certificate errors that occur in your browser.
```javascript
handydevserver(443, [/*dirs*/], { ssl: true });
```