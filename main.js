let repl = require('repl')
let exec = require('child_process').exec
let fs = require('fs')

repl.start({prompt: '> ', eval: myEval});

function myEval(stdin, context, filename, stdout) {
    tryBash(stdin)
    .then(stdout)
    .catch(err => {
        tryEval(stdin)
        .then(stdout)
        .catch(()=>stdout('not a thing'))
    })
}

function tryEval(input){
    return new Promise((resolve, reject) => {
        try { resolve(eval(input)) }
        catch(err) { reject(err) }
    })
}

function tryBash(input){
    return new Promise((resolve, reject) => {
       exec(input, (err, stdout, stderr) => {
            err && reject('err ' + err)
            stderr && reject('stderr ' + !!stderr)
            resolve(stdout.trim())
       })
    })
}
