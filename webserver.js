var express = require('express'),
  http = require("http"),
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
    default:
      return "text/html";
  }
}

/**
 * Send informative 404
 * @param response
 * @param fl
 */
function write404(response, fl) {
  response.writeHead(404, {"Content-Type": "text/html"});
  response.write("<!DOCTYPE html><html><head><title>404 File Not Found - Dev Server</title></head><body>");
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
  response.writeHead(500, {"Content-Type": "text/html"});
  response.write("<!DOCTYPE html><html><head><title>404 File Not Found - Dev Server</title></head><body>");
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
    response.writeHead(200, {"Content-Type": "text/javascript"});
    response.write(compiledSnippet);
    response.end();
  } catch (e) {
    write500(response, e.message);
  }
}

/**
 * Write the smoke page
 * @param response
 * @param isdebug
 * @param gatewaytagfolder
 */
function writeSmokePage(response, isdebug) {
  try {

    var pageHTML = "<!DOCTYPE html><html><head><title>Smoke Test Index Page</title></head><body><h1>Smoke Tests</h1><p>Tests:</p><ul>";
    var smss = fs.readdirSync("./bin/smoketests/");
    for (var i = 0; i < smss.length; i++) {
      var fln = smss[i].toString();
      if (fln.toLowerCase().indexOf('.html') > -1 || fln.toLowerCase().indexOf('.htm') > -1) {
        pageHTML += "<li><a href=\"smoketests/" + fln + "\">" + fln + "</a></li>";
      }
    }

    pageHTML += "</ul></body></html>";

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(pageHTML);
    response.end();
  } catch (e) {
    write500(response, e.message);
  }
}

/**
 * Set up the server
 * @param location
 * @param port
 * @param isdebug
 * @param gatewaytagfolder
 */
function wsEngine(location, port, isdebug, gatewaytagfolder) {
  http.createServer(function (request, response) {
    if (request.url.toString() == '/gateway.js') {
      writeGateway(response, isdebug, gatewaytagfolder);
    } else if (request.url.toString() == '/gateway.min.js') {
      writeGateway(response, isdebug, gatewaytagfolder);
    } else if (request.url.toString().toLowerCase() == "/smoke.html") {
      writeSmokePage(response, isdebug);
    }
    else {
      var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd() + (location || '/test'), uri);

      if (request.url.toString().indexOf('smoketests/') > -1) {
        filename = path.join(process.cwd() + "/bin/", uri);
      }

      filename = filename.replace(/\/\//g, '/');

      fs.exists(filename, function (exists) {
        if (!exists) {
          write404(response, filename);
          return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';
        filename = filename.replace(/\/\//g, '/');
        if (fs.existsSync(filename)) {

          fs.readFile(filename, "binary", function (err, file) {
            if (err) {
              response.writeHead(500, {"Content-Type": "text/plain"});
              response.write(err + "\n");
              response.end();
              return;
            }

            response.writeHead(200, {"Content-Type": getContentTypeFromFile(filename)});
            response.write(file, "binary");
            response.end();
          });
        } else {
          write404(response, filename);
          return;
        }

      });
    }
  }).listen(parseInt(port, 10));
};

var WebServer = function () {

};

WebServer.prototype.start = function (port, location, isdebug, gatewaytagfolder) {
  wsEngine(location, port, !!isdebug, gatewaytagfolder);
};

/**
 * Set up the exports
 */
module.exports = WebServer;