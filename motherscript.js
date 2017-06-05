var domain = 'localhost'
var fs = require('fs')
var http = require('http')
var {proxy, spinChild, getChild, outputOptions} = require('./lib.js')
http.createServer((request,response) => {
  var subdomain = request.headers.host.split(domain)[0]
  if(!subdomain){response.writeHead(302, {'Location': '//guest.' + request.headers.host + request.url}); return response.end()}
  else if( getChild(subdomain) !== undefined ) proxy(request,response,getChild(subdomain))  // check if a child process exists and proxy to it
  else spinChild(request, response, subdomain)                                // otherwise, create new child process and pass response to it
}).listen(3000)

interpretSubprocess = require('child_process').exec('node interpret')
process.stdin.pipe(interpretSubprocess.stdin)
interpretSubprocess.stdout.pipe(outputOptions['allInfo' || 'successOnly']).pipe(process.stdout)



//Future potential for a universal logging system that intercepts all of the responses from all the requests, and in that way record each terminal command coming from any user, and have a comprehensive record of access. Not only allowing you to look back at where things went wrong, but allowing the re-building of a system by playback of arhived commands! Very resilient backup and restore model, integrated with git versioning.

// So every eval, every network request, and result of puts by the way is a version request, so the timing of those commits entertwined with other elements (including network traffic) will allow for very specific instruction-by-instruction . So it's a very cool way to pipe instructions from all directions into a central action repository. We'll see how quickly that file grows.... and that's also a good way to study and visualize how people interact with the new OS. People can share their records, comment on each others transcripts....'

//as a result 
