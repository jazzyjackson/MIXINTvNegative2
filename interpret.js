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
    try {
        resolve(eval(input))
    }
    catch(err){ 
        reject( err.toString()) 
    }
})

const tryBash = input => new Promise((resolve, reject) => {
    if(input.toLowerCase().trim() == 'what') return reject('what with no arguments hangs the shell on some systems. maybe just Mac')
    if(!input.trim()) return reject(`Blank line doesn't mean anything so I'll chat instead.`)
    if(input[0] == ':') return reject(': is no-op in bash! input will be ignored, no error thrown')
    var processpipe = exec(input)
        .on('error', err => reject(err.toString()))
        .on('exit', (code, signal) => code === 0 ? resolve(code) : reject(code || signal))
    processpipe.stdout.on('data', bashData => process.stdout.write(JSON.stringify({bashData}) + '\n'))
    processpipe.stderr.on('data', bashData => reject(bashData))
})

const close = result => process.stdout.write(JSON.stringify(result) + '\n')

process.stdin.on('data', input => {
    input = input.toString('utf8')    
    tryBash(input)
    .then(successBash => close({input, successBash}))
    .catch(bashErr => {
        tryEval(input)
        .then(successEval => close({input, successEval, bashErr}))
        .catch(evalErr => {
            ChatScript.chat(input) //here is a good place to pipe error messages as OOB into chatscript for this user.  User is set via environment variable.
            .then(successfulChat => close({input, successfulChat, evalErr, bashErr}))
            .catch(chatErr => close({input, bashErr, evalErr, chatErr}))
        })
    })
})