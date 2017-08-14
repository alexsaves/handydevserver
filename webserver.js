var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  https = require('https'),
  pem = require('pem'),
  dirString = path.dirname(fs.realpathSync(__filename));

var headContents = "<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>a {text-decoration:none;} a:hover{text-decoration: underline;} body {font-family: Verdana, Tahoma, Arial; font-size: 80%;} .isdir {background-image:url('/foldericon.png'); background-repeat:no-repeat; padding-left: 1.6em; background-size:1.3em 1em;} @media only screen and (max-width: 500px) {body {font-size: 85%;}}</style>";

// The SSL options
var ssloptions = {
  requestCert: true,
  rejectUnauthorized: false
};

/**
 * Determine a helpful content type
 * @param filename
 * @returns {string}
 */
function getContentTypeFromFile(filename) {
  var extension = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase().trim();
  switch (extension) {
    case "html":
      return "text/html";
    case "htm":
      return "text/html";
    case "js":
      return "text/javascript";
    case "css":
      return "text/css";
    case "zip":
      return "application/zip";
    case "gif":
      return "image/gif";
    case "png":
      return "image/png";
    case "jpg":
      return "image/jpeg";
    case "jpeg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/vnd.microsoft.icon";
    default:
      return "text/html";
  }
}

/**
 * Is this a text based file?
 * @param filename
 * @returns {string}
 */
function isTextBasedFile(filename) {
  var extension = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase().trim();
  switch (extension) {
    case "html":
      return true;
    case "xml":
      return true;
    case "xslt":
      return true;
    case "xhtml":
      return true;
    case "now":
      return true;
    case "htm":
      return true;
    case "js":
      return true;
    case "jsx":
      return true;
    case "css":
      return true;
    case "txt":
      return true;
    case "md":
      return true;
    case "less":
      return true;
    case "sass":
      return true;
    case "c":
      return true;
    case "cs":
      return true;
    case "cpp":
      return true;
    case "me":
      return true;
    default:
      return false;
  }
}

/**
 * Is this an html based file?
 * @param filename
 * @returns {string}
 */
function isHTMLFile(filename) {
  var extension = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase().trim();
  switch (extension) {
    case "html":
      return true;
    case "htm":
      return true;
    case "xhtml":
      return true;
    default:
      return false;
  }
}

/**
 * Is this a JS file?
 * @param filename
 * @returns {string}
 */
function isJSFile(filename) {
  var extension = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase().trim();
  switch (extension) {
    case "js":
      return true;
    default:
      return false;
  }
}

/**
 * Spit out the favicon
 * @param response
 */
function writeFolderIcon(response) {
  var pth = (__dirname.indexOf('/') > -1) ? '/' : '\\';
  response.writeHead(200, {"Content-Type": "image/png", "Access-Control-Allow-Origin": "*"});
  response.write(fs.readFileSync(__dirname + pth + 'foldericon.png'));
  response.end();
}

/**
 * Spit out the favicon
 * @param response
 */
function writeFavicon(response) {
  var pth = (__dirname.indexOf('/') > -1) ? '/' : '\\';
  response.writeHead(200, {"Content-Type": "image/vnd.microsoft.icon", "Access-Control-Allow-Origin": "*"});
  response.write(fs.readFileSync(__dirname + pth + 'ficon.ico'));
  response.end();
}

/**
 * Send informative 404
 * @param response
 * @param fl
 */
function write404(response, fl) {
  if (fl.toLowerCase().indexOf('favicon.ico') > -1) {
    writeFavicon(response);
    return;
  } else if (fl.toLowerCase().indexOf('foldericon.png') > -1) {
    writeFolderIcon(response);
    return;
  }
  response.writeHead(404, {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"});
  response.write("<!DOCTYPE html><html><head>" + headContents + "<title>404 File Not Found - Handydevserver</title></head><body>");
  response.write("<h1>404 Not Found</h1><p>The resource <u><code>" + fl + "</code></u> was not located.</p>\n");
  response.write("<hr>");
  response.write("<p><i>(dev server error page)</i></p>");
  response.write("</body></html>");
  response.end();
}

/**
 * Send informative 500
 * @param response
 * @param msg
 */
function write500(response, msg) {
  response.writeHead(500, {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"});
  response.write("<!DOCTYPE html><html><head>" + headContents + "<title>404 File Not Found - Handydevserver</title></head><body>");
  response.write("<h1>500 Server Error</h1><p>" + msg + "</p>\n");
  response.write("<hr>");
  response.write("<p><i>(dev server error page)</i></p>");
  response.write("</body></html>");
  response.end();
}

/**
 * Write the directory page
 * @param response
 * @param isdebug
 * @param gatewaytagfolder
 */
function writeDirPage(response, folderpath, relpath, locations, config) {
  //console.log("DIR PAGE", folderpath, relpath);
  var pageHTML = "<!DOCTYPE html><html><head>" + headContents + "<title>Directory Listing</title></head><body><h1>Directory Listing</h1><p>";
  if (relpath != '/') {
    pageHTML += "<a href=\"../\">../Back</a>";
  }
  pageHTML += "<p>Resources:</p><ul>";

  for (var d = 0; d < locations.length; d++) {
    var locpart = locations[d];
    if (!(typeof locpart == 'string')) {
      locpart = Object.keys(locpart)[0];
    }
    if (fs.existsSync(path.normalize(locpart + relpath))) {
      var startPath = path.normalize(locpart + relpath),
        smss = fs.readdirSync(startPath),
        isdir = false;
      for (var i = 0; i < smss.length; i++) {
        var fln = smss[i].toString(),
          tmppath = relpath,
          fullpath = path.normalize(startPath + '/' + fln);
        isdir = fs.lstatSync(fullpath).isDirectory();
        if (tmppath.substr(-1) == '/') {
          tmppath = tmppath.substr(0, tmppath.length - 1);
        }
        var doit = true;
        if (config.ignore.length > 0) {
          for (var p = 0; p < config.ignore.length; p++) {
            var stm = config.ignore[p].toString().toLowerCase();
            if (fln.toLowerCase().indexOf(stm) > -1) {
              doit = false;
            }
          }
        }

        if (doit) {
          pageHTML += "<li><a href=\"" + tmppath + '/' + fln + "\" class=\"" + (isdir ? 'isdir' : '') + "\">" + fln + (isdir ? '/' : '') + "</a></li>";
        }
      }
    }
  }
  pageHTML += "</ul></body></html>";

  var headers = {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"};
  var cheaders = config.headers || {};
  var xhkeys = Object.keys(cheaders);
  for (var i = 0; i < xhkeys.length; i++) {
    headers[xhkeys[i]] = cheaders[xhkeys[i]];
  }
  response.writeHead(200, headers);
  response.write(pageHTML);
  response.end();
}

/**
 * Set up the server
 * @param location
 * @param port
 * @param isdebug
 * @param gatewaytagfolder
 */
function wsEngine(locations, port, config) {
  config.ignore = config.ignore || [];
  this.paths = locations;
  var requestHandler = function (request, response) {
    var rurl = request.url.toString(),
      validUrl = "",
      query = "",
      didFind = false;

    if (rurl.indexOf('?') > -1) {
      query = rurl.substr(rurl.indexOf('?') + 1).split('&');
      rurl = rurl.substr(0, rurl.indexOf('?'));
      if (query && query.length > 0) {
        var qargs = {};
        for (var b = 0; b < query.length; b++) {
          query[b] = query[b].split('=');
          for (var h = 0; h < query[b].length; h++) {
            qargs[decodeURIComponent(query[b][0])] = decodeURIComponent(query[b][1] || '');            
          }
        }
        query = qargs;
      } else {
        query = {};
      }
    } else {
      query = {};
    }
    for (var i = 0; i < locations.length; i++) {
      if (typeof locations[i] == 'string') {
        var furl = locations[i] + rurl;
        if (fs.existsSync(furl)) {
          validUrl = furl;
          didFind = true;
          break;
        }
      } else {
        var key = Object.keys(locations[i])[0],
          val = locations[i][key];
        if (rurl.length >= val.length && rurl.toLowerCase().substr(0, val.length) == val.toLowerCase()) {
          var turl = key + rurl.substr(val.length);
          if (fs.existsSync(turl)) {
            rurl = turl;
            validUrl = turl;
            didFind = true;
            break;
          }
        }

      }
    }
    if (didFind) {
      fs.readFile(validUrl, "binary", function (err, file) {
        if (err) {
          if (err.errno == 28 || err.errno == -21) {
            writeDirPage(response, validUrl, rurl, locations, config);
          } else {
            write404(response, JSON.stringify(err));
          }
          return;
        }

        var newHeaders = {"Content-Type": getContentTypeFromFile(validUrl), "Access-Control-Allow-Origin": "*"};

        if (config.ontextfile && isTextBasedFile(validUrl)) {
          file = config.ontextfile(validUrl, file, newHeaders, query);
        }
        if (isHTMLFile(validUrl)) {
          // IE privacy policy. Needed for IE8.
          newHeaders.P3P = 'CP="CURa ADMa DEVa CONo HISa OUR IND DSP ALL COR"';
          if (config.onhtmlfile) {
            file = config.onhtmlfile(validUrl, file, newHeaders);
          }
        }
        if (config.onjsfile && isJSFile(validUrl)) {
          file = config.onjsfile(validUrl, file, newHeaders);
        }
        if (config.latency === 0) {
          var cheaders = config.headers || {},
            xhkeys = Object.keys(cheaders);
          for (var i = 0; i < xhkeys.length; i++) {
            newHeaders[xhkeys[i]] = cheaders[xhkeys[i]];
          }
          response.writeHead(200, newHeaders);
          response.write(file, "binary");
          response.end();
        } else {
          var dly = 0;
          if (typeof(config.latency) == 'number') {
            dly = config.latency;
          } else {
            dly = Math.max(0, Math.round((Math.random() * (Math.max(config.latency[1], config.latency[0]) - Math.min(config.latency[1], config.latency[0]))) + Math.min(config.latency[1], config.latency[0])));
          }
          setTimeout(function() {
            var cheaders = config.headers || {};
            var xhkeys = Object.keys(cheaders);
            for (var i = 0; i < xhkeys.length; i++) {
              newHeaders[xhkeys[i]] = cheaders[xhkeys[i]];
            }
            response.writeHead(200, newHeaders);
            response.write(file, "binary");
            response.end();
          }, dly);
        }
      });
    } else {
      // Still no luck. Let's tell the browser.
      write404(response, "File " + rurl + " not found.");
    }
  };
  if (config.ssl) {
    pem.createCertificate({days: 1, selfSigned: true}, function (err, keys) {
      https.createServer({key: keys.serviceKey, cert: keys.certificate}, requestHandler).listen(parseInt(port, 10));
    });
  } else {
    http.createServer(requestHandler).listen(parseInt(port, 10));
  }
}

/**
 * Sets up a new web server
 * @constructor
 */
var WebServer = function () {

};

/**
 * fire it up
 * @param port
 * @param location
 * @param cfg
 */
WebServer.prototype.start = function (port, location, cfg) {
  wsEngine(location, port, cfg);
};

/**
 * Set up the exports
 */
module.exports = WebServer;
