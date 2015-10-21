/*
   Minimal BIBFRAME Editor Node.js server. To run from the command-line:
   node server-bfe.js
   
*/
var port = 8000;
var util = require('util');
var express = require('express')
var serveStatic = require('serve-static')
 
var app = express()
 
app.use(serveStatic('__dirname', {'index': ['default.html', 'default.htm']}))
app.listen(port);

util.puts('BIBFRAME Editor running on ' + port);
util.puts('Press Ctrl + C to stop.'); 
