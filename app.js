// var express = require('express');
// var app = exports.app = express();
// var path = require('path');
// var port = process.env.PORT || 4400;
// var EventEmitter = require("events").EventEmitter;
// var session = require('express-session');
// var mongoStore = require('connect-mongo')(session);

// var ee = new EventEmitter();

// require('./config')(app, mongoStore);

// require('./routes')(app, ee);

// exports.server = require('http').createServer(app).listen(port, function() {
//   console.log('Oughtness API started on port %d', port);
// });

// process.on('uncaughtException', function(err){
//   console.log('Exception: ' + err.stack);
// });

var fs = require('fs');
var options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
};
var express = require('express');
var app = exports.app = express();
var path = require('path');
var http = require('http').Server(app);
var port = process.env.PORT || 4400;
var EventEmitter = require("events").EventEmitter;
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var ee = new EventEmitter();

require('./config')(app, mongoStore);

require('./routes')(app, ee);

exports.server = require('https').createServer(options, app).listen(port, function() {
  console.log('Oughtness API started on port %d', port);
});

process.on('uncaughtException', function(err){
  console.log('Exception: ' + err.stack);
});
