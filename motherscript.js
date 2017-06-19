var domain = 'localhost'
var fs = require('fs')
var http = require('http')
var { proxy, spinChild, childExists, getChild, outputOptions, printFromAbove1979 } = require('./childProxy.js')

var logFile = fs.createWriteStream('./motherscript.log',{flags: 'a'}) //open file for appending
logFile.write(new Date().toUTCString() + '  OK Ready\n')
http.createServer((request,response) => {
  var subdomain = request.headers.host.split(domain)[0]
  logFile.write([new Date().toUTCString(), // log the date
                subdomain.slice(0,-1) || 'null',   
                request.connection.remoteAddress,
                request.method,           // GET/POST/DELETE/PUT
                decodeURI(request.url),   // decode for readability
                '\n'].join(' '))          // end with new line. joining an array just to save writing out all the + ' ' +s
  if(!subdomain){ response.writeHead(302, {'Location': '//guest.' + request.headers.host + request.url}); response.end() }
  else if( childExists(subdomain) ) proxy(request,response,getChild(subdomain))  // check if a child process exists and proxy to it
  else spinChild(request, response, subdomain)                                              // otherwise, create new child process and pass response to it
}).listen(3000)
// simulate the effect of booting microserver in a flat file structure (you can download microserver and have a fully operable web application without writing any more network logic, files are streamed from disk and childprocesses have their outputs streamed to the client, so you get really responsive performance without doing any work. Make the option for PUTs to append to file, would make for a really easy API. if you don't allow access to any files outside the folder, there shouldn't be any security issues if the POST requests are handled by a proper restricted uid

interpretSubprocess = require('child_process').exec('node interpret',{cwd: __dirname + '/index'})
//input stream transform to take action on any special commands, like cd. also a good place to blacklist strings, from input to the bash. Sanitize input.
process.stdin.pipe(interpretSubprocess.stdin)
interpretSubprocess.stdout.pipe(outputOptions['allInfo' || 'successOnly']).pipe(process.stdout)// || for allInfo, && for successOnly
interpretSubprocess.stderr.pipe(process.stdout)
// process.on('uncaughtException', err => {
//   logFile.write(new Date().toUTCString() + ' ERROR: ' + err + '\n')
//   console.log(new Date().toUTCString() + ' ERROR: ' + err + '\n')
// })
process.on('SIGHUP', () => logFile.write(new Date().toUTCString() + ' EXIT: SIGHUP (shell terminated)\n'))
process.on('SIGINT', () => {
  logFile.write(new Date().toUTCString() + ' EXIT: SIGINT (^-C exit requested) ' + '\n')
  process.exit()
})
//to read execution history from log file, grab the last kb or whatever, findIndex of the first occurance of { not preceded by \, slice it there, then split on new line and parse... or just regex the pattern and incomplete messages wont matter.

//Future potential for a universal logging system that intercepts all of the responses from all the requests, and in that way record each terminal command coming from any user, and have a comprehensive record of access. Not only allowing you to look back at where things went wrong, but allowing the re-building of a system by playback of arhived commands! Very resilient backup and restore model, integrated with git versioning.

// So every eval, every network request, and result of puts by the way is a version request, so the timing of those commits entertwined with other elements (including network traffic) will allow for very specific instruction-by-instruction . So it's a very cool way to pipe instructions from all directions into a central action repository. We'll see how quickly that file grows.... and that's also a good way to study and visualize how people interact with the new OS. People can share their records, comment on each others transcripts....'