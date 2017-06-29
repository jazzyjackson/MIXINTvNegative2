/********* load some dependencies, node built ins, nothing to install ***********/

var spawn   = require('child_process').spawn
var fs     = require('fs')
var http   = require('http')
var os     = require('os')
var path   = require('path')
var repl   = require('repl')
var stream = require('stream')
var url    = require('url')
var util   = require('util')

/************** and some global variables for convenience *******************/

var hostname       = 'localhost'
var portCollection = {}
var proxyRequest   = http.request

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	// logRequest(request)
	response.setHeader('x-powered-by','multi-interpreter')
	identify(request)
	if( !request.userid ) return fs.createReadStream('sphinx.html').pipe(response)
	if( port4u(request.userid) ) return proxy(request, response, port4u(request.userid))
	else return createPort4u(request, response)
}).listen(process.env.PROD_PORT || 3000)

/********* identify user, check if magic link is associated *******************/

function identify(request){

    request.destination = '/branches/root/'
    request.bot = 'shelly'
    return request.userid = 'colten'

    // request can set a cookie, and set ephemeral properties on the request object
    // so port4u and createPort4u can just check properties on the request object.
	//check if cookie is still valid
	//check if request is coming with a query
	//check if query is registered to a username, return username
}

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

repl.start({eval: (cmd, context, filename, callback) => {
    try {
        callback(util.inspect(eval(cmd))) //this eval is in the server's scope
    } catch(e) {
        interpreter = spawn('node', ['interpret',cmd], { cwd: __dirname + '/branches/root/' })
        var spawnbuffer = '' // I think I want to use buffer concat but I have to look it up
        interpreter.stdout.on('data', data => spawnbuffer += data.toString())
        interpreter.stderr.on('data', data => spawnbuffer += data.toString())
        interpreter.on('close', () => callback(blob2allInfo(spawnbuffer))) //blob2successOnly || blob2allInfo
    }
}})
/***** Handle shell hang ups and uncaught errors. SIGHUP is when shell exits, SIGINT is ^-C ***/

// process.on('SIGHUP', error => logError('system', 'SIGHUP'))
// process.on('SIGINT', error => logError('system', 'SIGINT') || process.exit())
// process.on('uncaughtException',  error => logError('system', error)) // && process.exit() here if you want to

/*********** function definitions for the above server ******************/

// gotta move logging to bookkeeper and pipe stuff into it.
// gotta create authentication - identity routing. Generate a magic link accessible via API, 
// 

function createPort4u(request, response){
    var userid = request.userid
	var shell = spawn('node',['switchboard.js'], {cwd: __dirname + '/branches/root',
                                          env: { CSUSER: userid, CSBOT: request.bot, PATH: process.env.PATH }})

	shell.stdout.on('data', port => {
        var port = port.toString()
		portCollection[userid] = {shell, port, userid}
		proxy(request, response, port)
	})

	shell.stderr.on('data', err => {
		response.writeHead(500)
		response.end(util.inspect(error))
		// logError(userid, error)
	})

	shell.on('error', error => {
		response.writeHead(500)
		response.end(util.inspect(error))
		// logError(userid, error)
	})
}

function proxy(request, response, port){
    portCollection[request.userid].lastRequest = Date.now()

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

/***************************************************/

function blob2successOnly(result){
    result = JSON.parse(result)
    return result.bashData 
        || result.successfulChat
        || result.successEval 
        || result.successBash
}

function blob2allInfo(result){
    result = JSON.parse(result)
    return Object.keys(result)
                 .map(key => key + ': ' + util.inspect(result[key]))
                 .join(os.EOL) + os.EOL
}