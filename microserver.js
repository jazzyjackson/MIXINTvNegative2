var fs = require('fs')
var http = require('http')
var exec = require('child_process').exec
var server = http.createServer((request,response) => ({
    'GET': () => fs.createReadStream(request.url[request.url.length - 1] === '/' ? __dirname + '/index.html' :  '.' + request.url, 'utf8')
                   .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) })
                   .pipe(response),
    'POST': () => exec(decodeURI(request.url.split('?')[1]))  //, {cwd: __dirname + request.url.split('?')[0]})
                 .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) })
                 .stdout.pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => { response.writeHead(201); response.end() })
                        .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + request.url, err => {response.writeHead( err ? 500 : 204); response.end( err ? JSON.stringify(err) : null)})
})[request.method]()).listen().on('listening', () => process.stdout.write(String(server.address().port)))

//a note on piping to a fresh exec process each time - most importantly this allows for parellel executions of multiple long running scripts...
//but on the server repl, it works a little differently. A constraint of the stdin stdout handling is that we can't take new input until we're done writing to output. So a persistant connection makes sense on the server -  and allows for manipulation of global variables (hopefully). Client side, I think I might just evaluate javascript in the scope of the window first, so for window execution you still get to manipulate global variables that persist between calls.
//if you need to store variables on the shell... hm I wonder if you can manipulate shell variables, do they cross ways with other shell processes?


//a few constraints: it's up to you to handle what files exist within the reach of the get and post requests. You can modify this to reach into a sub folder by default, right now it will grab index.html in whatever directory the process was started in
//if you ever get an error like : RangeError: "port" option should be >= 0 < 65536, it's because something inside here logged to console before the server address was written to stdout. The mothscript is waiting for a port numbers and drops it right into a proxy'