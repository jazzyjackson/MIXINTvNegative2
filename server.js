const fs = require('fs')
const http = require('http')
const exec = require('child_process').exec
http.createServer((request,response) => ({
    'GET': () => fs.createReadStream('.' + request.url, 'utf8')
                   .on('error', err => response.end(JSON.stringify(err)))
                   .pipe(response),
    // the result of interpret should, at some point, be intercepted, such that it can be arranged for delivery to client. Maybe if chatscript returns a command, the server needs to know to start that task. So intercept it.
    'POST': () => exec('node interpret ' + decodeURI(request.url.split('?')[1])).stdout.pipe(response),
    'PUT': () => request.pipe(fs.createWriteStream('.' + request.url, 'utf8'))
                        .on('finish', () => response.end()),
    'DELETE': () => fs.unlink('.' + request.url, err => response.end( err ? JSON.stringify(err) : 'OK'))
})[request.method]()).listen(3000)