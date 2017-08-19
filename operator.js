/********* node built ins, nothing to install ***********/

var spawn  = require('child_process').spawn
var exec  = require('child_process').exec
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

var port = process.env.PORT || 3000
var portCollection = {}

/********* stream responses to shell created for your user id ****************/

http.createServer(async (request, response) => {
    await keymaker.identify(request, response)
    keymaker.setEnvironment(request)
    if( request.userid == undefined ){
        response.writeHead(302, { 'Location': keymaker.redirurl })
        response.end()
    } else if(request.url.match(/key=([0-9A-F]+)/)){
        response.writeHead(302, { 'Location': '//' + request.headers.host })
        response.end()
    } else {
        proxy(request, response, port4u(request.userid)) || createPort4u(request, response)
    }
}).listen(port)

/********** interpret requests on stdin for REPL interactiviy in host's shell **************/

var rootLoginURL = 'http://' + getLocalIP() + ':' + port + '/?key=' + keymaker.allow('root')
console.log(rootLoginURL)
exec(os.platform() == 'win32' ? 'start ' + rootLoginURL : 'open ' + rootLoginURL)

/* default parameters */
process.env.interpretMode = 'bashFirst'
process.env.userid = 'root'
process.env.bot = 'harry'

repl.start({eval: (cmd, context, filename, callback) => {
    try {
        callback(util.inspect(eval(cmd))) //this eval is in the server's scope so we can check server variables form terminal
    } catch(e) {
        interpreter = spawn('node', ['interpret',cmd], { cwd: __dirname + '/root/' })
        var buffers = []
        interpreter.stdout.on('data', data => buffers.push(data))
        interpreter.stderr.on('data', data => buffers.push(data))
        // interpreter.on('close', () => callback(blob2successOnly(parseBuffer(Buffer.concat(buffers))))) //blob2successOnly || blob2allInfo
        interpreter.on('close', () => console.log(Buffer.concat(buffers).toString())) //blob2successOnly || blob2allInfo
    }
}})

/**** proxy functions *******/

function createPort4u(request, response){
    var userid = request.userid
    var shell = spawn('node',['switchboard.js'], request.environment)

    shell.stdout.on('data', port => {
        var port = port.toString() //comes back as a buffer. so decode it to string.
        /* if all goes well, switchboard will simply return the port number it booted on. If it returns something else, throw it. */
        if(isNaN(Number(port))) throw new Error(port)
        portCollection[userid] = {
            shell, 
            port, 
            userid, 
            interpretMode: request.environment.env.interpretMode,
            cwd: request.environment.cwd
        }
        proxy(request, response, port)
    })

    shell.stderr.on('data', error => {
        /* if an error is reported before the response stream is closed, report the error the the client and close the stream */
        /* in any case, log the error with the userid of the node process that reported the error */
        response.writeable && response.writeHead(500)
        response.writeable && response.end(util.inspect(error))
        bookkeeper.logError(userid, error)
    })

    shell.on('error', error => {
        response.writeHead(500)
        response.end(util.inspect(error))
        bookkeeper.logError(userid, error)
    })
}

function proxy(request, response, port){
    if(!port) return port /* if port is undefined, exit function with falsey value */
    var {watchRequest, watchResponse} = bookkeeper.observe(request, response)

    portCollection[request.userid].lastRequest = Date.now()

    request.pipe(watchRequest).pipe(http.request({
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

    return port /* if proxy was successful, exit with truthy value. hopefully port is not 0 lol. */
    /* oh wow I just learned that to request a system port you just ask the system to bind to port 0 */
}

function port4u(userid){
    /* don't try to access port property if port[userid] is undefined, just return undefined */
    return portCollection[userid] && portCollection[userid].port
} 

/***************************************************/

function blob2successOnly(result){
    return result.bashData 
        || result.goodchat
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