/********* load some dependencies, node built ins, nothing to install ***********/

var spawn   = require('child_process').spawn
var fs     = require('fs')
var http   = require('http')
var os     = require('os')
var path   = require('path')
var repl   = require('repl')
var stream = require('stream')
var util   = require('util')
var url    = require('url')

/************** and some global variables for convenience *******************/

var proxyRequest   = http.request
var hostname       = 'localhost'
var portCollection = {}
var pipeOptions    = createTransforms()

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	logRequest(request)
	response.setHeader('x-powered-by','multi-interpreter')
	identify(request)
	if( !request.userid ) return fs.createReadStream('sphinx.html').pipe(response)
	if( port4u(request.userid) ) return proxy(request, response, port4u(request.userid))
	else return createPort4u(request, response)
}).listen(process.env.PROD_PORT || 3000)

/********* identify user, check if magic link is associated *******************/

function identify(request){

    request.destination = '/branches/root/'
    return request.userid = 'colten'

    // request can set a cookie, and set ephemeral properties on the request object
    // so port4u and createPort4u can just check properties on the request object.
	//check if cookie is still valid
	//check if request is coming with a query
	//check if query is registered to a username, return username
}

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

// interpreter = spawn('node interpret', { cwd: __dirname + '/branches/root/' })
// interpreter.stdout.pipe(pipeOptions['successOnly']).pipe(process.stdout)// || for allInfo, && for successOnly
// interpreter.stderr.pipe(process.stdout)
// interpreter.on('error', error => logError('interpret', error))
// process.stdin.pipe(pipeOptions['logInput']).pipe(interpreter.stdin)

repl.start({eval: (cmd, context, filename, callback) => {
    try {
        callback(util.inspect(eval(cmd)))
    } catch(e) {
        callback("there was an error")
        // spawn('node', ['interpret', cmd])
        // spawn.stdout.on('data', callback)
    }
}})
/***** Handle shell hang ups and uncaught errors. SIGHUP is when shell exits, SIGINT is ^-C ***/

process.on('SIGHUP', error => logError('system', 'SIGHUP'))
process.on('SIGINT', error => logError('system', 'SIGINT') || process.exit())
process.on('uncaughtException',  error => logError('system', error)) // && process.exit() here if you want to

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
		logError(userid, error)
	})

	shell.on('error', error => {
		response.writeHead(500)
		response.end(util.inspect(error))
		logError(userid, error)
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

function logError(userid, error){
    // hopefully there's not enough errors for blocking to be a big deal
    // appendFileSync allows us to write to file even when the program has been requested to exit. Sync write THEN exit.
    fs.appendFileSync('./logs/error.log', JSON.stringify({
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
    }) + os.EOL, () => undefined)
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
                                    || result.successfulChat
                                    || result.successEval 
                                    || result.successBash
		chunk.toString()
			 .split(/\n(?={)/g)
			 .map(JSON.parse)
			 .forEach(result => {
                result = mostSuccessful(result)
                result = typeof result === 'object' ? util.inspect(result) : String(result)
                this.push(result + os.EOL)
			 })
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