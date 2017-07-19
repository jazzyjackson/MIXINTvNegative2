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

/************** and some global variables for convenience *******************/

var portCollection = {}
var proxyRequest   = http.request
var port 	       = process.env.PORT || 3000

/********* stream responses to shell created for your user id ****************/

http.createServer((request, response) => {
	keymaker.identify(request, response) //synchronously attaches userid to request object, set cookie on response
	keymaker.unlockEnvironmentFor(request)    //synchronously attaches working directectory and environment variables for this user
	if( !request.userid ) { response.writeHead(401); return response.end("401 Not Authorized. You did not receive an identity from the keymaker") }
	if( port4u(request.userid) ) return proxy(request, response, port4u(request.userid))
	else return createPort4u(request, response)
}).listen(port)

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

console.log(getLocalIP() + ':' + port + '/?key=' + keymaker.allow('root'))

repl.start({eval: (cmd, context, filename, callback) => {
    try {
        callback(util.inspect(eval(cmd))) //this eval is in the server's scope so we can check server variables form terminal
    } catch(e) {
        interpreter = spawn('node', ['interpret',cmd], { cwd: __dirname + '/root/' })
        var buffers = []
        interpreter.stdout.on('data', data => buffers.push(data))
        interpreter.stderr.on('data', data => buffers.push(data))
        interpreter.on('close', () => callback(blob2successOnly(parseBuffer(Buffer.concat(buffers))))) //blob2successOnly || blob2allInfo
    }
}})

/**** proxy functions *******/

function createPort4u(request, response){
    var userid = request.userid
    var shell = spawn('node',['switchboard.js'], request.environment)

    shell.stdout.on('data', port => {
        var port = port.toString()
        portCollection[userid] = {shell, port, userid}
        proxy(request, response, port)
    })

    shell.stderr.on('data', error => {
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
        hostname: 'localhost',
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
    return result.bashData 
        || result.successfulChat
        || result.successEval 
        || result.successBash
}

function blob2allInfo(result){
    return Object.keys(result)
                 .map(key => key + ': ' + util.inspect(result[key]))
                 .join(os.EOL) + os.EOL
}

function parseBuffer(resultBlob){
    result = {}
    resultBlob.toString().split(/\n(?={)/g).map(jsonchunk => {
        objectchunk = JSON.parse(jsonchunk)
        Object.keys(objectchunk).forEach(prop => {
			result[prop] ? result[prop] += objectchunk[prop]
                         : result[prop] = objectchunk[prop]
		})
    })
    return result
}

function getLocalIP(){
	var networkInterfaces = os.networkInterfaces()
	for(var interface in networkInterfaces){
		for(var address in interface){
			if(networkInterfaces[interface][address].family == 'IPv4' && networkInterfaces[interface][address].internal == false){
				return networkInterfaces[interface][address].address
			}
		}
	}
}