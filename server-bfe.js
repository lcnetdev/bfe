/*
   Minimal BIBFRAME Editor Node.js server. To run from the command-line:
   node server-bfe.js
   
*/
var port = 8000;
var connect = require('connect');
var util = require('util');
connect.createServer(connect.static(__dirname)).listen(port)
util.puts('BIBFRAME Editor running on ' + port);
util.puts('Press Ctrl + C to stop.'); 

