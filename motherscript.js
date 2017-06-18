var domain = 'localhost'
var fs = require('fs')
var http = require('http')
var { proxy, spinChild, getChild, outputOptions } = require('./lib.js')
var logFile = fs.createWriteStream('./motherscript.log',{flags: 'a'}) //open file for appending

http.createServer((request,response) => {
  var subdomain = request.headers.host.split(domain)[0]
  logFile.write([new Date().toUTCString(), // log the date
                 subdomain.slice(0,-1),    // and the subdomain sans trailing dot
                 request.connection.remoteAddress,
                 request.method,           // GET/POST/DELETE/PUT
                 decodeURI(request.url),   // decode for readability
                 '\n'].join(' '))          // end with new line. joining an array just to save writing out all the + ' ' +s
  if(!subdomain){ response.writeHead(302, {'Location': '//guest.' + request.headers.host + request.url}); response.end() }
  else if( getChild(subdomain) !== undefined ) proxy(request,response,getChild(subdomain))  // check if a child process exists and proxy to it
  else spinChild(request, response, subdomain)                                              // otherwise, create new child process and pass response to it
}).listen(3000)

logFile.write(new Date().toUTCString() + ' ' + 'server started')

interpretSubprocess = require('child_process').exec('node interpret')
//input stream transform to take action on any special commands, like cd. also a good place to blacklist strings, from input to the bash. Sanitize input.
process.stdin.pipe(interpretSubprocess.stdin)
interpretSubprocess.stdout.pipe(outputOptions['allInfo' || 'successOnly']).pipe(process.stdout)// || for allInfo, && for successOnly

process.on('uncaughtException', err => logFile.write(new Date().toUTCString() + ' server crashed: ' + err.toString() + '\n'))
process.on('SIGHUP', () => logFile.write(new Date().toUTCString() + ' server exit requested SIGHUP terminal exitted\n'))
process.on('SIGINT', () => {
  logFile.write(new Date().toUTCString() + ' server exit requested SIGINT ^-C ' + '\n')
  process.exit()
})
//to read execution history from log file, grab the last kb or whatever, findIndex of the first occurance of { not preceded by \, slice it there, then split on new line and parse... or just regex the pattern and incomplete messages wont matter.

//Future potential for a universal logging system that intercepts all of the responses from all the requests, and in that way record each terminal command coming from any user, and have a comprehensive record of access. Not only allowing you to look back at where things went wrong, but allowing the re-building of a system by playback of arhived commands! Very resilient backup and restore model, integrated with git versioning.

// So every eval, every network request, and result of puts by the way is a version request, so the timing of those commits entertwined with other elements (including network traffic) will allow for very specific instruction-by-instruction . So it's a very cool way to pipe instructions from all directions into a central action repository. We'll see how quickly that file grows.... and that's also a good way to study and visualize how people interact with the new OS. People can share their records, comment on each others transcripts....'

//as a result 

// a possibly useful and devious behavior - listen for signal 'hangup' and on your wait syncExec a child process motherscript that wrangles itself free of this mother process. So it exits like you said, but immediately slips off to create a new instance of itself. You can readily talk to it anyway by invoking a PATH variable, like replchat.  