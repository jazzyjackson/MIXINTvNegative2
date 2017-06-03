var domain = 'localhost'
var fs = require('fs')
var http = require('http')
var {proxy, spinChild, getChild} = require('./lib.js')

http.createServer((request,response) => {
  var subdomain = request.headers.host.split(domain)[0]
  if(!subdomain){response.writeHead(302, {'Location': '//guest.' + request.headers.host + request.url}); return response.end()}
  else if( getChild(subdomain) ) proxy(request,response,getChild(subdomain))  // check if a child process exists and proxy to it
  else spinChild(request, response, subdomain)                                // otherwise, create new child process and pass response to it
}).listen(3000)