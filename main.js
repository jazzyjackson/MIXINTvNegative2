let repl = require('repl')
let exec = require('child_process').exec
let fs = require('fs')

repl.start({prompt: '> ', eval: myEval});

//lol promises were invented to get rid of callback pyramids
//but I'm going to make a promise pyramid.
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
        //exec returns a bundle, stderr, stdout, and err.
       exec(input, (err, stdout, stderr) => {
            if(err){
                reject('err ' + err)
            } else if (stderr){
                reject('stderr ' + stderr)
            } else {
                //.trim to throw out the newline
                resolve(stdout.trim())
            }
       })
    })
}
