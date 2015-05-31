var webserver = require('./webserver'),
  colors = require('colors'),
  strftime = require('strftime');

/**
 * Log an error
 * @param eventDetails
 */
var logError = function (eventDetails) {
  console.log(("[" + strftime('%B %d, %y %H:%M:%S') + "] ").magenta + "Error: ".red + eventDetails.red);
};

/**
 * Log an event
 * @param eventDetails
 */
var logEvent = function (eventDetails) {
  console.log(("[" + strftime('%B %d, %y %H:%M:%S') + "] ").magenta + eventDetails);
};

/**
 *
 * @param config
 * @returns {*|exports}
 */
function doServerStart(port, dir, lv, isdebug, tagfolder) {
  if (!lv) {
    var lv = logEvent;
  }
  lv("Starting web server at http://localhost:" + port + " for folder " + dir + " (Smoke tests at http://localhost:" + port + "/smoke.html)...");
  lv("Press CTRL-C to stop.".yellow);
  var WS = new webserver();
  WS.start(port, dir, isdebug, tagfolder);
}

// Expose the interface
module.exports = doServerStart;