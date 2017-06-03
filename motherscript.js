var domain = 'localhost'
var fs = require('fs')
var http = require('http')
var {proxy, spinChild, getChild} = require('./lib.js')

http.ServerResponse.prototype.redirect = function redirect(newpath){
  this.writeHead(302, {'Location': newpath})
  this.end()
}

http.createServer((request,response) => {
  subdomain = request.headers.host.split(domain)[0]
  if(!subdomain) return response.redirect('//guest.' + request.headers.host + request.url)
  getChild(subdomain)                              // check if a child process exists
    ? proxy(request,response,getChild(subdomain)) //if so, proxy the connection
    : spinChild(request, response, subdomain)     // otherwise, create new child process and pass response to it
}).listen(3000)