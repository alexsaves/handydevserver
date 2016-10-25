var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  https = require('https'),
  pem = require('pem'),
  dirString = path.dirname(fs.realpathSync(__filename));


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
  }
  response.writeHead(404, {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"});
  response.write("<!DOCTYPE html><html><head><title>404 File Not Found - Handydevserver</title></head><body>");
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
  response.write("<!DOCTYPE html><html><head><title>404 File Not Found - Handydevserver</title></head><body>");
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

  var pageHTML = "<!DOCTYPE html><html><head><title>Directory Listing</title></head><body><h1>Directory Listing</h1><p><a href=\"../\">../Back</a><p>Resources:</p><ul>";
  for (var d = 0; d < locations.length; d++) {
    if (fs.existsSync(path.normalize(locations[d] + relpath))) {
      var smss = fs.readdirSync(path.normalize(locations[d] + relpath));
      var isdir = false;
      for (var i = 0; i < smss.length; i++) {
        var fln = smss[i].toString(),
          tmppath = relpath;
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
          pageHTML += "<li><a href=\"" + tmppath + '/' + fln + "\">" + fln + (isdir ? '/' : '') + "</a></li>";
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
      didFind = false;

    if (rurl.indexOf('?') > -1) {
      rurl = rurl.substr(0, rurl.indexOf('?'));
    }
    for (var i = 0; i < locations.length; i++) {
      var furl = locations[i] + rurl;
      if (fs.existsSync(furl)) {
        validUrl = furl;
        didFind = true;
        break;
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
          file = config.ontextfile(validUrl, file, newHeaders);
        }

        if (config.latency === 0) {
          var cheaders = config.headers || {};
          var xhkeys = Object.keys(cheaders);
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
