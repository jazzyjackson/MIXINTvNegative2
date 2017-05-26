const repl = require('repl')
const exec = require('child_process').exec
const fs = require('fs')
const Koa = require('koa')
const router = require('koa-route')
const app = new Koa()

const readStaticFile = require('./static')

// load views into variables

app.use(router.get('/', require('./index/metaparser')))

// app.use( ctx => ctx.body = index() )
app.listen(3000)


repl.start({prompt: '> ', eval: myEval});
function myEval(stdin, context, filename, stdout) {
    stdout(eval(stdin))
}

// function restart(){
//     process.on('SIGHUP')
//     process.exit()
// }

// function myEval(stdin, context, filename, stdout) {
//     tryBash(stdin)
//     .then(stdout)
//     .catch(basherr => {
//         tryEval(stdin)
//         .then(stdout)
//         .catch(evalerr => stdout(`Everything is terrible: \nbasherr:\n${basherr}\n\nevalerr:\n${evalerr}`))
//     })
// }

function tryEval(input){
    return new Promise((resolve, reject) => {
        try { resolve(eval(input)) }
        catch(err) { reject(err) }
    })
}

function tryBash(input){
    return new Promise((resolve, reject) => {
       if(input.toLowerCase().trim() == 'what') reject('what with no arguments hangs the shell')
       exec(input, (err, stdout, stderr) => {
            err && reject('err ' + err)
            stderr && reject('stderr ' + stderr)
            resolve(stdout.trim())
       })
    })
}

// ChatScript.chat('',':reset','')
//      .then(botResponse => console.log(botResponse.output))
//      .then(bootRepl)
//      .catch(response => {
//         if(response.error){
//           console.log('error: ', response.error)
//           console.log('Let me try to start the chatscript server myself')
//           ChatScript.startServer()
//           //though windows doesn't mind attempting to hit the server immediately after starting the process, mac os wants some time. Unfortunately, the child process doesn't provide immediate feedback if starting the server was successful or not, so we just have to try to hit it again.
//           setTimeout(() => {
//             ChatScript.chat('',':reset','')
//                 .then(botResponse => console.log(botResponse.output))
//                 .then(bootRepl)
//                 .catch(error => {
//                   console.log(`I wasn't able to start the server. Received message: ${error.error}`)
//                   process.exit()
//                 })
//           }, 1000)
//         }
//      }) 