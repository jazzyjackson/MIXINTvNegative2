
/********* load some dependencies, node built ins, nothing to install ***********/

var fs     = require('fs')
var os     = require('os')
var http   = require('http')
var path   = require('path')
var util   = require('util')
var url    = require('url')
var stream = require('stream')
var exec  = require('child_process').exec

/************** and some global variables for convenience *******************/

var proxyRequest = http.request
var hostname     = 'localhost'
var portCollection = {}
var pipeOptions = createTransforms()

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	logRequest(request)
	response.setHeader('x-powered-by','multi-interpreter')
	var userid = request.headers.host.split(hostname)[0] || null
	var redirectHeaders = { 'Location': '//guest.' + request.headers.host + request.url }
	if( userid == null ) return response.writeHead(302, redirectHeaders) || response.end()
	if( port4u(userid) ) return proxy(request, response, port4u(userid))
	else return createPort4u(request, response, userid)
}).listen(process.env.PROD_PORT || 3000)

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

interpreter = exec('node interpret', { cwd: __dirname + '/branches/root/' })
interpreter.stdout.pipe(pipeOptions['successOnly']).pipe(process.stdout)// || for allInfo, && for successOnly
interpreter.stderr.pipe(process.stdout)
interpreter.on('error', error => logError('interpret', error))
process.stdin.pipe(pipeOptions['logInput']).pipe(interpreter.stdin)

/***** Handle shell hang ups and uncaught errors. SIGHUP is when shell exits, SIGINT is ^-C ***/

process.on('SIGHUP', error => logError('system', 'SIGHUP'))
process.on('SIGINT', error => logError('system', 'SIGINT') || process.exit())
process.on('uncaughtException',  error => logError('system', error)) // && process.exit() here if you want to

/*********** function definitions for the above server ******************/

function createPort4u(request, response, userid){
	var shell = exec('node microserver', {cwd: __dirname + '/branches/root'})//+ path.sep + 'index'})

	shell.stdout.on('data', port => {
		portCollection[userid] = {shell, port, userid}
		proxy(request, response, port)
	})

	shell.stderr.on('data', err => {
		response.writeHead(500)
		response.end(util.inspect(error))
		logError(userid, error)
	})

	shell.on('error', error => {
		response.writeHead(500)
		response.end(util.inspect(error))
		logError(userid, error)
	})
}

function proxy(request, response, port){
	request.pipe(proxyRequest({
		hostname: hostname,
		port: port,
		path: request.url, 
		headers: request.headers, 
		method: request.method,
		agent: false
	}, proxyResponse => {
		response.writeHeader(proxyResponse.statusCode, proxyResponse.headers)
		proxyResponse.pipe(response)
	}))
}

function port4u(userid){
	return portCollection[userid] && portCollection[userid].port
}

function logError(userid, error){
  fs.appendFile('./logs/error.log', JSON.stringify({
		ztime: new Date(),
		userid: userid, 
		error: util.inspect(error || "undefined error")
	}) + os.EOL)
}

function logRequest(request){
  //host will be like guest.localhost.com. Split domain, slice off trailing dot, use no-user if that's an empty string.
  var userid = request.headers.host.split(hostname)[0].slice(0,-1) || 'no-user' 
  fs.appendFile(`./logs/${userid}.log`, JSON.stringify({
      userid: userid, 
      method: request.method,
      path:   request.url.split('?')[0],
      query:  decodeURI(request.url.split('?')[1]),
      ipaddr: request.connection.remoteAddress,
      ztime: new Date()
	}) + os.EOL)
}

/***************************************************/

function createTransforms(){
	var logInput = new stream.Transform()
	logInput._transform = function(chunk, encoding, done){
		this.push(chunk)
		fs.appendFile(`./logs/stdin.log`, JSON.stringify({stdin: chunk.toString() + os.EOL}), done)
	}

	var successOnly = new stream.Transform()
	successOnly._transform = function(chunk, encoding, done){
		var mostSuccessful = result => result.bashData 
							|| (result.successfulChat && result.successfulChat.output )//might be a number, push REALLY only wants a string
							||  result.successEval 
							||  result.successBash
		chunk.toString()
			 .split(/\n(?={)/g)
			 .map(JSON.parse)
			 .forEach( result => this.push(String(mostSuccessful(result)) + os.EOL))
		done()
	}

	var allInfo = new stream.Transform()
	allInfo._transform = function(chunk, encoding, done){
		var result = JSON.parse(chunk.toString())
		this.push(Object.keys(result)
						.map(key => key + ': ' + util.inspect(result[key]))
						.join(os.EOL) + os.EOL)
		done()
	}
	return {logInput, successOnly, allInfo}
}