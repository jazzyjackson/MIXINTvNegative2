var exec = require('child_process').exec
var http = require('http')
var path = require('path')
var url = require('url')
var Transform = require('stream').Transform

var childRegistry = {}
var proxyRequest = http.request

console.log(__dirname)
function getChild(childName){
  return childRegistry[childName] // might return undefined. No big deal.
}
function childExists(childName){
  return Boolean(childRegistry[childName]) // of course getChild could already be used as a Boolean, this is just a more readable check, "if(childExists())"
}

function printFromAbove1979(){
  console.log({cwd: __dirname + path.sep + 'index'})
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
  
  var newServer = exec('node microserver', {cwd: __dirname + '/index'})//+ path.sep + 'index'})
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
    response.writeHead(500)
    response.end(data.toString())
  })
}

var successOnly = new Transform()
successOnly._transform = function(chunk, encoding, done){
  //This works because I don't anticipate receiving chunks larger than one line of text, this stream is produced by interpret, which writes one object at a time.
  chunk.toString().split(/\n(?={)/g).forEach(line => {
    var result = JSON.parse(line)
    if(result.bashData){
      this.push(String(result.bashData))
    } else {
      result = ((result.successfulChat && result.successfulChat.output) || result.successEval || result.successBash )
      this.push(typeof result === 'object' ? JSON.stringify(result) + '\n' : String(result) + '\n')
    }
  })
  done()
}

var allInfo = new Transform()
allInfo._transform = function(chunk, encoding, done){
  var result = JSON.parse(chunk.toString())
  this.push(Object.keys(result).reverse().map(key => key + ': ' + JSON.stringify(result[key])).join('\n') + '\n')
  done()
}

module.exports = {proxy, spinChild, childExists, getChild, printFromAbove1979, outputOptions: {allInfo, successOnly}}
