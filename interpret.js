let repl = require('repl')
let exec = require('child_process').exec
let fs = require('fs')

let ConnectionHandler = require('./connectionHandler.js')
const chatscript_config = { port: process.env.CSPORT || 1024, 
                            host: process.env.CSHOST || 'localhost',
                            defaultUser: 'guest',
                            defaultBot: 'Harry',
                            debug: false }

let ChatScript = new ConnectionHandler(chatscript_config)
let stdin = process.argv.slice(2).join(' ')
let stdout = message => process.stdout.write(JSON.stringify({message: message}))

tryBash(stdin)
  .then(stdout)
  .catch(basherr => {
    tryEval(stdin)
    .then(stdout)
    .catch(evalerr => {
      ChatScript.chat(stdin)
      .then(stdout)
      .catch(chatErr => stdout(`Everything is terrible: \nbasherr\n${basherr}\nevalerr:\n${evalerr}\nchaterr:${chatErr}`))
    })
})


function tryEval(input){
    return new Promise((resolve, reject) => {
        try { resolve(eval(input)) }
        catch(err) { reject(err) }
    })
}

function tryBash(input){
    return new Promise((resolve, reject) => {
       if(input.toLowerCase().trim() == 'what') reject('what with no arguments hangs the shell on some systems. maybe just Mac')
       if(input[0] == ':') reject(': is no-op in bash! input will be ignored, no error thrown')
       exec(input, (err, stdout, stderr) => {
            err && reject('err ' + err)
            stderr && reject('stderr ' + !!stderr)
            resolve(stdout.trim())
       })
    })
}
