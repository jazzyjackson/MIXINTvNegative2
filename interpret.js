const repl = require('repl')
const exec = require('child_process').exec
const fs = require('fs')
/* ChatScriptConnection exports a constructor function for a class with a '.chat' method, 
which creates a new TCP socket and returns a promise to communicate with a ChatScript server */
const ChatScriptConnection = require('./ChatScriptConnection.js')
const chatscript_config = { port: process.env.CSPORT || 1024, 
                            host: process.env.CSHOST || 'localhost',
                            defaultUser: process.env.CSUSER || 'guest',
                            defaultBot: process.env.CSBOT || 'Harry',
                            debug: false } //set debug to true to print a bunch of status messages when connecting.

const ChatScript = new ChatScriptConnection(chatscript_config)

const tryEval = input => new Promise((resolve, reject) => {
    try { resolve(eval(input)) }
    catch(err) { reject(err) }
})

const tryBash = input => new Promise((resolve, reject) => {
    if(input.toLowerCase().trim() == 'what') reject('what with no arguments hangs the shell on some systems. maybe just Mac')
    if(input[0] == ':') reject(': is no-op in bash! input will be ignored, no error thrown')
    else exec(input)
        .on('error', err => reject(err))
        .on('exit', (code, signal) => code === 0 ? resolve(code) : reject(code || signal))
        .stdout.on('data', bashData => process.stdout.write(JSON.stringify({bashData})))
})

const close = result => process.stdout.write(JSON.stringify(result))

process.stdin.on('data', incomingMessage => {
    incomingMessage = incomingMessage.toString('utf8')    
    tryBash(incomingMessage)
    .then(successBash => close({successBash}))
    .catch(bashErr => {
        tryEval(incomingMessage)
        .then(successEval => close({successEval,bashErr}))
        .catch(evalerr => {
            ChatScript.chat(incomingMessage) //here is a good place to pipe error messages as OOB into chatscript for this user.  User is set via environment variable.
            .then(successfulChat => close({successfulChat, evalerr, bashErr}))
            .catch(chatErr => close({bashErr, evalerr, chaterr}))
        })
    })
})