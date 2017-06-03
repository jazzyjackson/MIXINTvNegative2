var fs = require('fs')
var http = require('http')
var exec = require('child_process').exec
var server = http.createServer((request,response) => ({
    'GET': () => fs.createReadStream(request.url[request.url.length - 1] === '/' ? './index.html' :  '.' + request.url, 'utf8')
                   .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) })
                   .pipe(response),
    'POST': () => exec('node interpret ' + decodeURI(request.url.split('?')[1]))
                    .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) })
                    .stdout.pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => { response.writeHead(201); response.end() })
                        .on('error', err => { response.writeHead(500); response.end(JSON.stringify(err)) }),
    'DELETE': () => fs.unlink('.' + request.url, err => {response.writeHead( err ? 500 : 204); response.end( err ? JSON.stringify(err) : null)})
})[request.method]()).listen().on('listening', () => process.stdout.write(String(server.address().port)))