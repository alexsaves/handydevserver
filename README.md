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
      ontextfile: function (filename, contents, headers) {
        if (filename.indexOf('gateway.js') || filename.indexOf('gateway.min.js')) {
          contents = contents.replace(/foo/gi, "bar");
        }
        // Add some header
        headers.myHeader = 'some header value';
        return contents;
      }
    });
```

###HTTPS
To run the server on HTTPS protocol, you just simply need to pass in the SSL cert files path names.
```javascript
handydevserver(
    8080,
   ['./dist', './smoketest', './gateway'],
    {},
    ssl: {
        cert: ".../pathfofile/cert.pem",
        key: ".../pathtokey/key.pem"
    }
    });
```

You can generate a self signed SSL certificate using OpenSSL. See example below.
```javascript
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

