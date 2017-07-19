/********* node built ins, nothing to install ***********/

var spawn  = require('child_process').spawn
var fs     = require('fs')
var http   = require('http')
var os     = require('os')
var path   = require('path')
var repl   = require('repl')
var util   = require('util')

/************** locally defined modules *******************/

var bookkeeper = require('./bookkeeper')
var keymaker = require('./keymaker')
var switchboard = require('./root/switchboard')

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	keymaker.identify(request, response)
	keymaker.unlockEnvironmentFor(request)
	if( !request.userid ) { 
        response.writeHead(302, { 'Location': keymaker.redirurl }); 
        response.end() 
    } else {
        bookkeeper.observe(request, response)
        switchboard(request, response)
    }
}).listen(process.env.PORT || 3000)