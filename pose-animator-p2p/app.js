// We need the file system here
var fs = require('fs');
				
// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static('dist'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
  res.send('Hello World!')
});

// Here is the actual HTTP server 
// In this case, HTTPS (secure) server
var https = require('https');

// Security options - key and certificate
var options = {
    // key: fs.readFileSync('/home/jsherwood/ssl/star_itp_io.key'),
	// cert: fs.readFileSync('/home/jsherwood/ssl/star_itp_io.pem')
	    //for local teseting
	key: fs.readFileSync('/home/jsherwood/ssl/star_itp_io.key'),
	cert: fs.readFileSync('/home/jsherwood/ssl/star_itp_io.pem')
};

// We pass in the Express object and the options object
var httpServer = https.createServer(options, app);

// Default HTTPS port
httpServer.listen(443);
