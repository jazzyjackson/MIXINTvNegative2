const repl = require('repl')
const exec = require('child_process').exec
const fs = require('fs')
const bookkeeper = require('./../../bookkeeper')
/* ChatScriptConnection exports a constructor function for a class with a '.chat' method, 
which creates a new TCP socket and returns a promise to communicate with a ChatScript server */
const ChatScriptConnection = require('./ChatScriptConnection.js')
const ChatScript = new ChatScriptConnection({ port: process.env.CSPORT || 1024, 
                                              host: process.env.CSHOST || 'localhost',
                                              defaultUser: process.env.CSUSER || 'devsession',
                                              defaultBot: process.env.CSBOT || 'shelly',
                                              debug: false })

const interpret = {
    bashFirst: input => tryBash(input)
                        .then(successBash => close({successBash}))
                        .catch(bashErr => {
                            ChatScript.chat(input) //here is a good place to pipe error messages as OOB into chatscript for this user.  User is set via environment variable.
                            .then(successfulChat => close(successfulChat))
                            .catch(chatErr => close({bashErr, chatErr}))
                        }),

    botFirst: input => ChatScript.chat(input)
                       .then(successChat => {
                           successChat.bash && tryBash(successChat.bash) // here is a good place to ChatScript.createfact associations of bash failing & completing, simple pid exit OK, pid exit Error
                       })
                       .catch(console.error.bind(console))
    
}

var mode = process.env.CONVOMODE || 'bashFirst'
process.argv[2] ? interpret[mode](process.argv[2])
                : process.stdin.on('data', input => interpret[mode](input.toString()))

function tryBash(input){
    return new Promise((resolve, reject) => {
        if(input.indexOf('what') == 0) return reject('what with no arguments hangs the shell on some systems. maybe just Mac')
        if(!input.trim()) return reject(`Blank line doesn't mean anything so I'll chat instead.`)
        if(input[0] == ':') return reject(': is no-op in bash! input will be ignored, no error thrown')
        var processpipe = exec(input)
            .on('error', err => reject(err.toString()))
            .on('exit', (code, signal) => code === 0 ? resolve(code) : reject(code || signal))
        processpipe.stdout.on('data', bashData => process.stdout.write(JSON.stringify({bashData}) + '\n'))
        processpipe.stderr.on('data', bashData => reject(bashData))
    })
}


function tryEval(input){
    return new Promise((resolve, reject) => {
        try {
            resolve(eval(input))
        }
        catch(err){ 
            reject(err.toString()) 
        }
    })
}


function close(result){
    process.stdout.write(JSON.stringify(result) + '\n')
}