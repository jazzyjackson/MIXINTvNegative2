var fs = require('fs')
var http = require('http')
var spawn = require('child_process').spawn
var figjam = require('./figjam.js')
var interpret = require('./interpret.js')

var server = http.createServer((request,response) => ({
    'GET': () => streamFileOrFigtree(request.url.split('?')[0].slice(1))
                   .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                   .pipe(response),
    'POST': () => interpret(decodeURI(request.url.split('?')[1]))
                 .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) })
                 .pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => { response.writeHead(201); response.end() })
                        .on('error', err => { response.writeHead(500); response.end( JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + request.url, err => { response.writeHead( err ? 500 : 204); response.end(JSON.stringify(err))})
})[request.method]()).listen().on('listening', () => console.log(server.address().port))

/* timeshare branch only. stateless shouldn't keep per user config files laying around */
function streamFileOrFigtree(pathname){
    return pathname ? fs.createReadStream(pathname)
                    : figjam('figtree.json')
}
/* code for stateless: 
    fs.createReadStream(pathname || 'gui/index.html')
*/