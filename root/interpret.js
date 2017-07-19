const repl = require('repl')
const exec = require('child_process').exec
const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')
/* ChatScriptConnection exports a constructor function for a class with a '.chat' method, 
which creates a new TCP socket and returns a promise to communicate with a ChatScript server */
const ChatScriptConnection = require('./ChatScriptConnection.js')
const ChatScript = new ChatScriptConnection({ port: process.env.CSPORT || 1024, 
                                              host: process.env.CSHOST || 'localhost',
                                              defaultUser: process.env.user || 'devsession',
                                              defaultBot: process.env.bot || 'harry',
                                              debug: false })

class interpretation {
    constructor(readable, string2interpret){
        this.readable = readable
        this.interpret(string2interpret)
    }

    interpret(input){
        switch(process.env.convomode.toLowerCase()){
            case 'bashfirst': 
                this.tryBash(input).then(goodBash => this.end({goodBash}))
                    .catch(badBash => {
                        ChatScript.chat(input).then(goodChat =>  {
                            goodChat.bash && this.tryBash(goodChat.bash)
                            this.end(goodChat)
                        })
                        .catch(badChat => this.end({badBash, badChat}));
                    }); break;
            case 'botfirst':
                ChatScript.chat(input).then(goodChat => {
                    goodChat.bash && this.tryBash(goodChat.bash)
                    this.end(goodChat)
                })
                .catch(chatErr => this.end({chatErr})); break;
            default: this.end({debug: "no convomode specified via environment variable"})
        }
    }

    tryBash(input){
        return new Promise((resolve, reject) => {
            if(input.indexOf('what') == 0) return reject('what with no arguments hangs the shell on some systems. maybe just Mac')
            if(!input.trim()) return reject(`Blank line doesn't mean anything so I'll chat instead.`)
            if(input[0] == ':') return reject(': is no-op in bash! input will be ignored, no error thrown')
            var processpipe = exec(input)
                .on('error', err => reject(err.toString()))
                .on('exit', (code, signal) => code === 0 ? resolve(code) : reject(code || signal))
            processpipe.stdout.on('data', bashData => this.readable.push(JSON.stringify({bashData}) + '\n'))
            processpipe.stderr.on('data', bashData => reject(bashData))
        })
    }

    tryEval(input){
        return new Promise((resolve, reject) => {
            try {
                resolve(eval(input))
            }
            catch(err){ 
                reject(err.toString()) 
            }
        })
    }

    end(result){
        this.readable.push(JSON.stringify(result))
        this.readable.push(null)
    }
}

/* This works whether you call it as a standalone process, or import the function as a module */
/* node interpret hello */
var interpretCalledDirectly = process.argv[1].split(path.sep).slice(-1)[0] == 'interpret'

if(interpretCalledDirectly && process.argv[2]){
    var readable = new PassThrough
    new interpretation(readable, process.argv[2])
    readable.pipe(process.stdout)
}

/* require('./interpret')('hello') */
module.exports = string2interpret => {
    var readable = new PassThrough 
    new interpretation(readable, string2interpret)
    return readable
}