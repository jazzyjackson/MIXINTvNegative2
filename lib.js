var exec = require('child_process').exec
var http = require('http')
var url = require('url')
var childRegistry = {}
var proxyRequest = http.request

module.exports = {proxy, spinChild, getChild}

function getChild(childName){
  return childRegistry[childName] // might return undefined. No big deal.
}

function proxy(request, response, child){
  request.pipe(proxyRequest({
    hostname: 'localhost',
    port: child.port,
    path: request.url,
    headers: request.headers,
    method: request.method,
    agent: false
  }, proxyResponse => {
    response.writeHeader(proxyResponse.statusCode, proxyResponse.headers)
    proxyResponse.pipe(response)
  }))
}

function spinChild(request, response, childName){
  var newServer = exec('node microserver')
  newServer.stdout.on('data', data => {
    childRegistry[childName] = {
      stream: newServer,
      pid: newServer.pid,
      port: data.trim(),
      name: childName
    }
    proxy(request, response, childRegistry[childName])
  })
  newServer.on('error', data => {
    respond.writeHead(500)
    respond.end(data)
  })
}