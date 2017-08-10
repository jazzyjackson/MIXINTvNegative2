var fs = require('fs')
var http = require('http')
var path = require('path')
var spawn = require('child_process').spawn
var figjam = require('./figjam.js')
var interpret = require('./interpret.js')
var bookkeeper = require('../bookkeeper.js')

var handleRequest = (request,response) => ({
    'GET': () => streamFileOrFigtree(request.url.split('?')[0].slice(1))
                .on('open', () => { 
                    // the setHeader functionality doesn't rely on the open event occuring. on open is just a convenient event that fires once before the stream closes.
                    request.url.split('?')[0].includes('.svg') && response.setHeader('Content-Type','image/svg+xml')
                    request.url.split('?')[0].includes('.css') && response.setHeader('Content-Type','text/css')
                })
                .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                .pipe(response),
    'POST': () => interpret(decodeURI(request.url.split('?')[1]), request) /* request becomes 'options' object for interpret, includes botname, username, and mode */
                 .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                 .pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => { response.writeHead(201); response.end() })
                        .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + request.url, err => { response.writeHead( err ? 500 : 204); response.end(JSON.stringify(err))})
})[request.method]()

/* if a file is requested, stream it right back */
/* but if there's no pathname a.k.a. '/' index route, read figtree.json and concatanate files in a continuous stream */ 
function streamFileOrFigtree(pathname){
    // figure out if you're running within root already. this is pretty inelegant, but it's to re-use this code whether switchboard is running with cwd of this directory or of the directory above
    var prefix = process.cwd().includes('root') ? '' : 'root/'
    return pathname ? fs.createReadStream(prefix + pathname)
                    : figjam(prefix + 'figtree.json')
}

/* This works whether you call it as a standalone process, or import the function as a module */
/* node interpret hello */
var switchboardCalledDirectly = process.argv[1].split(path.sep).slice(-1)[0].includes('switchboard')

if(switchboardCalledDirectly){
    var server = http.createServer()
    server.listen()
    server.on('listening', () => console.log(server.address().port))
    server.on('request', handleRequest)
}

/* require('./interpret')('hello') */
module.exports = handleRequest