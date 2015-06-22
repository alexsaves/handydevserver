var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs");

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
    default:
      return false;
  }
}

/**
 * Send informative 404
 * @param response
 * @param fl
 */
function write404(response, fl) {
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
 * Write a gateway.js
 * @param response
 * @param isdebug
 * @param gatewaytagfolder
 */
function writeGateway(response, isdebug, gatewaytagfolder) {
  try {
    var gatewayfile = isdebug ? "gateway.js" : "gateway.min.js",
      gatewayjs = fs.readFileSync(process.cwd() + '/tag_gateway/' + gatewaytagfolder + '/GATEWAY_JS/prod/' + gatewayfile),
      snippet = "AnswersProductWhitelist.foresee = " + fs.readFileSync(process.cwd() + '/dist/foresee/gateway/snippet.js') + ";",
      compiledSnippet = gatewayjs.toString().replace(/\/[*]+[^\/]+AnswersProductWhitelist[^#]*#uncomment[^\/]*\//g, snippet);
    response.writeHead(200, {"Content-Type": "text/javascript", "Access-Control-Allow-Origin": "*"});
    response.write(compiledSnippet);
    response.end();
  } catch (e) {
    write500(response, e.message);
  }
}

/**
 * Write the directory page
 * @param response
 * @param isdebug
 * @param gatewaytagfolder
 */
function writeDirPage(response, folderpath, relpath, locations) {

  var pageHTML = "<!DOCTYPE html><html><head><title>Directory Listing</title></head><body><h1>Directory Listing</h1><p>Resources:</p><ul>";
  for (var d = 0; d < locations.length; d++) {
    if (fs.existsSync(path.normalize(locations[d] + relpath))) {
      var smss = fs.readdirSync(path.normalize(locations[d] + relpath));
      for (var i = 0; i < smss.length; i++) {
        var fln = smss[i].toString(),
          tmppath = relpath;
        if (tmppath.substr(-1) == '/') {
          tmppath = tmppath.substr(0, tmppath.length - 1);
        }

        pageHTML += "<li><a href=\"" + tmppath + '/' + fln + "\">" + fln + "</a></li>";
      }
    }
  }
  pageHTML += "</ul></body></html>";

  response.writeHead(200, {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*"});
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

  this.paths = locations;
  http.createServer(function (request, response) {

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
          if (err.errno == 28) {
            writeDirPage(response, validUrl, rurl, locations);
          } else {
            write400(response, JSON.stringify(err));
          }
          return;
        }

        response.writeHead(200, {"Content-Type": getContentTypeFromFile(validUrl), "Access-Control-Allow-Origin": "*"});

        if (config.ontextfile && isTextBasedFile(validUrl)) {
          file = config.ontextfile(validUrl, file);
        }
        response.write(file, "binary");
        response.end();
      });
    } else {

      // Still no luck. Let's tell the browser.
      write404(response, "File " + rurl + " not found.");

    }
  }).listen(parseInt(port, 10));
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
