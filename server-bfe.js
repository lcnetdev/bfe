//   Minimal BIBFRAME Editor Node.js server. To run from the command-line:
//   node server-bfe.js

var port = 8000;
var express = require('express');
 
var app = express();
 
app.use(express.static(__dirname + '/'));
app.listen(port);

console.log('BIBFRAME Editor running on ' + port);
console.log('Press Ctrl + C to stop.'); 
