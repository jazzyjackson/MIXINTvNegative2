var exec = require('child_process').exec
var http = require('http')
var url = require('url')
var childRegistry = {}

module.exports = {proxy, spinChild, getChild}

function getChild(childName){
  return childRegistry[childName] // might return undefined. No big deal.
}

function proxy(request, response, child){
  console.log(child.name, 'proxy', request.url)
  request.pipe(http.request({
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
  console.log('spinChild', childName)
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
