var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');

// The magic prefix for special log output
// Must match packages/test-in-console/driver.js
var MAGIC_PREFIX = '##_meteor_magic##';
var MAGIC_PREFIX_REGEX = new RegExp(MAGIC_PREFIX);

var options = new chrome.Options();
var logOptions = new webdriver.logging.Preferences();
logOptions.setLevel('browser', webdriver.logging.Level.ALL);
options.setLoggingPrefs(logOptions);

var driver = new chrome.Driver(options);

var xunitEntries = [];

function magicEntry(facility, message) {
  if (facility === 'xunit' || facility === '#xunit') {
    xunitEntries.push(message);
  }
  else if (facility === 'state' || facility === '#state') {
    // Ignoring.
  }
  else {
    console.log("    [Unknown facility: " + facility + "] " + message);
  }
}

function processMagicMessage(message) {
  var regex = /([^\s]*)\s*([^\s]*)\s*(.*)/i;
  var match = regex.exec(message);
  if (!match) {
    console.log("Unknown console.log message format: " + message);
    return;
  }
  message = match[3];
  message = message.substring(MAGIC_PREFIX.length);
  var colonIndex = message.indexOf(': ');
  if (colonIndex === -1) {
    magicEntry('', message);
  }
  else {
    var facility = message.substring(0, colonIndex);
    message = message.substring(colonIndex + 2);
    magicEntry(facility, message);
  }
}

function processLogEntry(entry) {
  if (MAGIC_PREFIX_REGEX.test(entry.message)) {
    processMagicMessage(entry.message);
  }
  else {
    console.log("    [" + entry.level.name + "] " + entry.message);
  }
}

function storeResult() {
  if (!process.env.CIRCLE_TEST_REPORTS) return;

  var meteor = (process.env.METEOR_COMMAND || 'meteor').replace(/[^a-zA-Z0-9]/g, '');
  var baseDirectory = path.join(process.env.CIRCLE_TEST_REPORTS, meteor, process.env.PACKAGE || 'unknown');
  var xunitOutputFile = path.join(baseDirectory, 'test-results.xml');
  console.log("  > Writing xunit output to: " + xunitOutputFile);
  mkdirp.sync(baseDirectory);
  fs.writeFileSync(xunitOutputFile, xunitEntries.join('\n'));
}

console.log("  > Opening Meteor test suite...");
driver.get('http://127.0.0.1:4096/xunit').then(function() {
  console.log("  > Running tests...");

  // Wait for tests to complete.
  var pollTimer = setInterval(function() {
    // Output logs while the tests are running.
    driver.manage().logs().get('browser').then(function (log) {
      for (var index in log) {
        var entry = log[index];
        processLogEntry(entry);
      }
    });

    driver.executeScript(function() {
      if (typeof TEST_STATUS !== 'undefined')
        return TEST_STATUS.DONE;
      return typeof DONE !== 'undefined' && DONE;
    }).then(function(done) {
      if (done) {
        clearInterval(pollTimer);
        driver.executeScript(function () {
          if (typeof TEST_STATUS !== 'undefined')
            return TEST_STATUS.FAILURES;
          if (typeof FAILURES === 'undefined') {
            return 1;
          }
          return 0;
        }).then(function (failures) {
          // Output final logs.
          driver.manage().logs().get('browser').then(function (log) {
            for (var index in log) {
              var entry = log[index];
              processLogEntry(entry);
            }

            driver.quit().then(function() {
              storeResult();
              console.log("  > Tests completed " + (failures ? "WITH FAILURES" : "OK") + ".");
              process.exit(failures ? 1 : 0);
            });
          });
        });
      }
    });
  }, 500);
});
