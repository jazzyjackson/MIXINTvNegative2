/********* node built ins, nothing to install ***********/

var spawn  = require('child_process').spawn
var fs     = require('fs')
var http   = require('http')
var os     = require('os')
var path   = require('path')
var repl   = require('repl')
var stream = require('stream')
var url    = require('url')
var util   = require('util')

/************** locally defined modules *******************/

var bookkeeper = require('./bookkeeper')
var keymaker = require('./keymaker')

/************** and some global variables for convenience *******************/

var hostname       = 'localhost'
var portCollection = {}
var proxyRequest   = http.request

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	keymaker.identify(request, response) //synchronously modifies request object to attach userid, set cookie on response
	if( !request.userid ) return fs.createReadStream('sphinx.html').pipe(response)
	if( port4u(request.userid) ) return proxy(request, response, port4u(request.userid))
	else return createPort4u(request, response)
}).listen(process.env.PROD_PORT || 3000)

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

repl.start({eval: (cmd, context, filename, callback) => {
    try {
        callback(util.inspect(eval(cmd))) //this eval is in the server's scope so we can check server variables form terminal
    } catch(e) {
        interpreter = spawn('node', ['interpret',cmd], { cwd: __dirname + '/branches/root/' })
        var spawnbuffer = '' // I think I want to use buffer concat but I have to look it up
        interpreter.stdout.on('data', data => spawnbuffer += data.toString())
        interpreter.stderr.on('data', data => spawnbuffer += data.toString())
        interpreter.on('close', () => callback(blob2allInfo(spawnbuffer))) //blob2successOnly || blob2allInfo
    }
}})
/**** proxy functions *******/
function createPort4u(request, response){
    var userid = request.userid
	var shellOptions = {
		cwd: __dirname + '/branches/root',
		env: { CSUSER: userid, CSBOT: request.bot, PATH: process.env.PATH }
	}
	var shell = spawn('node',['switchboard.js'], shellOptions)

	shell.stdout.on('data', port => {
        var port = port.toString()
		portCollection[userid] = {shell, port, userid}
		proxy(request, response, port)
	})

	shell.stderr.on('data', err => {
		response.writeHead(500)
		response.end(util.inspect(error))
		bookkeeper.logError(userid, error)
	})

	shell.on('error', error => {
		response.writeHead(500)
		response.end(util.inspect(error))
		bookkeeper.logError(userid, error)
	})
}

function proxy(request, response, port){
	var {watchRequest, watchResponse} = bookkeeper.observe(request, response)

    portCollection[request.userid].lastRequest = Date.now()

	request.pipe(watchRequest).pipe(proxyRequest({
		hostname: hostname,
		port: port,
		path: request.url, 
		headers: request.headers, 
		method: request.method,
		agent: false
	}, proxyResponse => {
		response.writeHeader(proxyResponse.statusCode, proxyResponse.headers)
		proxyResponse.pipe(watchResponse).pipe(response)
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