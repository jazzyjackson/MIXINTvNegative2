var fs = require('fs')
var http = require('http')
var exec = require('child_process').exec
var server = http.createServer((req,res) => ({
    'GET': () => fs.createReadStream(req.url.length > 1 ? '.' + req.url : 'gui/index.html', 'utf8')
                   .on('error', err => { res.writeHead(500); res.end( JSON.stringify(err)) })
                   .pipe(res),
    'POST': () => exec(decodeURI(req.url.split('?')[1]))
                 .on('error', err => { res.writeHead(500); res.end( JSON.stringify(err)) })
                 .stdout.pipe(res),
    'PUT': () => req.pipe(fs.createWriteStream('.' + req.url, 'utf8'))
                    .on('finish', () => { res.writeHead(201); res.end() })
                    .on('error', err => { res.writeHead(500); res.end( JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + req.url, err => { res.writeHead( err ? 500 : 204); res.end( err ? JSON.stringify(err) : null)})
})[req.method]()).listen().on('listening', () => process.stdout.write(String(server.address().port)))
