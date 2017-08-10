const exec = require('child_process').exec
const path = require('path')
const { PassThrough } = require('stream')
/* ChatScriptConnection exports a constructor function for a class with a '.chat' method, 
which creates a new TCP socket and returns a promise to communicate with a ChatScript server */
const ChatScriptConnection = require('./ChatScriptConnection.js')
const ChatScript = new ChatScriptConnection({ 
    port: process.env.CSPORT || 1024, 
    host: process.env.CSHOST || 'localhost',
    defaultUser: process.env.user || 'unknown', /* not to be confused with 'nobody' */
    defaultBot: process.env.bot || 'harry',
    debug: false
})

class interpretation {
    constructor(readable, string2interpret, options = {}){
        this.options = options
        this.readable = readable
        this[options.mode](string2interpret, options.username, options.botname)
    }

    botFirst(input, username, botname){
        /* haven't figured out why goodchat isn't resolved when ChatScript replies with an empty message in the case of named bot not existing */
        ChatScript.chat(input, username, botname)
        .then(goodchat => this.send(goodchat) && this.tryBash(goodchat.bash)) // .bash might not exist, that's fine, tryBash will simply resolve
        .then(goodbash => this.end(goodbash ? {goodbash} : null)) // I have to keep an eye out for some case where close() would be called twice. like a .then fires, and later, a .catch tries to close. Will throw a 'cant set headers after they're sent' error
        .catch(rejection => this.end(rejection))
    }

    bashFirst(input, username, botname){
        this.tryBash(input)
        .then(goodbash => this.end({goodbash}))
        .catch(badbash => {
            ChatScript.chat(input, username, botname)
            .then(goodchat => this.send(goodchat) && this.tryBash(goodchat.bash)) // .bash might not exist, that's fine, tryBash will simply resolve
            .then(goodbash => this.end(goodbash ? {goodbash} : null)) // I have to keep an eye out for some case where close() would be called twice. like a .then fires, and later, a .catch tries to close. Will throw a 'cant set headers after they're sent' error
            .catch(rejection => this.end(rejection))
        })
    }

    tryBash(input){
        return new Promise((resolve, reject) => {
            // There's a few problems I ran into where the shell would hang waiting for input or succeed without output.
            // so I have some useful error codes to explain why bash wasn't attempted, but I should also have a race, to reject if there's no response
            // But I need an easily accessible switch to say "no its fine, let bash think for a while" hm hm hm 
            if(!input) return resolve()
            if(input.indexOf('what') == 0) return reject({bashReject: 'unixy systems have a what program that hangs the shell without an argument'})
            if(!input.trim()) return reject({bashReject: `Blank line doesn't mean anything`})
            if(input[0] == ':') return reject({bashReject: ': is no-op in bash! input will be ignored, no error thrown'})
            var processpipe = exec(input, {cwd: this.options.cwd || '.'})
                .on('error', err => reject({tryBashErr: err.toString()}))
                .on('exit', (code, signal) => code == 0 ? resolve(0) : reject(code)) // 0 is falsey, but "0" is not, lets resolve to a string
            processpipe.stdout.on('data', bashData => this.send({bashData}))
            processpipe.stderr.on('data', bashErr => this.send({bashErr}))
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
  
    tryMySQL(){
      // optional for ChatScript that runs sql for you. Connects to db from credentials file somehow, 
      // streams rows as they come to 'goodtable' so the clientside js can build a table around the data :D
    }
    tryPSQL(){
      // 
    }

    send(result){
        this.readable.push(JSON.stringify(result) + '\n')
        return result
    }

    end(result){
        /* closes the stream by pushing null byte, optionally sending one last object if passed an argument */
        result && this.readable.push(JSON.stringify(result) + '\n')
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
module.exports = (string2interpret, options) => {
    var readable = new PassThrough 
    new interpretation(readable, string2interpret, options)
    return readable
}
