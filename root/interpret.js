const exec = require('child_process').exec
const path = require('path')
const util = require('util')
const { PassThrough } = require('stream')
/* ChatScriptConnection exports a constructor function for a class with a '.chat' method, 
which creates a new TCP socket and returns a promise to communicate with a ChatScript server */
const ChatScriptConnection = require('./ChatScriptConnection.js')
const ChatScript = new ChatScriptConnection({ port: process.env.CSPORT || 1024, 
                                              host: process.env.CSHOST || 'localhost',
                                              defaultUser: process.env.user || 'unknown', /* not to be confused with 'nobody' */
                                              defaultBot: process.env.bot || 'harry',
                                              debug: false })

class interpretation {
    constructor(readable, string2interpret, options = {}){
        this.options = options
        this.readable = readable
        this.string2interpret = string2interpret
        this.promiseChain = makeIterator({
            botFirst: [this.tryChat],
            bashFirst: [this.tryBash, this.tryChat]
        }[process.env.interpretMode || 'botFirst']) // if environment wasn't set, default to bot
        this.iterateTilSuccess(this.promiseChain.next())
        this.heartbeat = setInterval(() => {
            this.send({heartbeat: true})
        }, 10000) // heartbeat every 10 seconds. interval cleared when this.end is called.

    }

    iterateTilSuccess(whatsNext){
        if(whatsNext.done) return this.end()
        else whatsNext.value.call(this, this.string2interpret) // use call in case function ref in array lost its context
        .then(success => {
            this.iterateTilSuccess({done: true})
        })
        .catch(failure => {
            this.send(typeof failure == 'object' ? failure : {failure, name: whatsNext.value.name})
            this.iterateTilSuccess(this.promiseChain.next())
        })
    }

    tryChat(input){
        return ChatScript.chat(input)
               .then(goodchat => this.send(goodchat))
               .then(goodchat => goodchat.bash ? tryBash(goodchat.bash) : goodchat)
               .then(goodchat => goodchat.eval ? tryEval(goodchat.eval) : goodchat)
    }

    tryBash(input){
        return new Promise((resolve, reject) => {
            // There's a few problems I ran into where the shell would hang waiting for input or succeed without output.
            // so I have some useful error codes to explain why bash wasn't attempted, but I should also have a race, to reject if there's no response
            // But I need an easily accessible switch to say "no its fine, let bash think for a while" hm hm hm 
            if(!input)
                return resolve()
            if(input.indexOf('what') == 0)
                return reject({bashReject: 'unixy systems have a what program that hangs the shell without an argument'})
            if(!input.trim())
                return reject({bashReject: `Blank line doesn't mean anything`})
            if(input[0] == ':')
                return reject({bashReject: ': is no-op in bash! input will be ignored, no error thrown'})
            var processpipe = exec(input, {cwd: this.options.cwd || '.', shell: '/bin/sh', env: process.env})
                .on('error', err => reject({tryBashErr: err.toString()}))
                .on('exit', (code, signal) => {
                    if(signal || code) reject(signal || code)
                    else this.send({goodbash: code}) && resolve(input)
                })
            processpipe.stdout.on('data', bashData => this.send({bashData}))
            processpipe.stderr.on('data', bashErr => this.send({bashErr}))
        })
    }

    tryEval(input){
        return new Promise((resolve, reject) => {
            if(!input) resolve(input)
            try {
                var result = eval(input)
                var evaldata = typeof result == 'object' ? JSON.stringify(decycle(result),'',4) 
                                                         : String(result)
                this.send({evaldata})
                resolve(input)
            }
            catch(err){ 
                reject({evalErr: err.toString()}) 
            }
        })
    }
  
    tryMySQL(input){
        let escapeCSV = datum => {
            // per csv definiton RFC 4180 https://tools.ietf.org/html/rfc4180#page-2
            if(typeof datum == 'string' && datum.match(/[",\n]/)){ //if there are commas or double quotes or newline characters
                datum = datum.replace(/"/g, `""`) //replace quotes that are part of the data with double quotes
                datum = `"${datum}"` //wrap the data in double quotes
            }
            return datum
        }
        let objectToCSV = row => {
            let csvrow = []
            for(var column in row){
                csvrow.push(escapeCSV(row[column]))
            }
            return csvrow.join(',') + '\n'
        }
        return new Promise((resolve, reject) => {
            if(!input.mysql) return resolve(input)            
            db.getConnection((err, conn) => {
                if(err) reject({dbError: err})
                conn.query(input.mysql)
                    .on('end', () => conn.release() || resolve(input))
                    .on('error', err => reject({queryError: err}))
                    .on('fields', fields => this.send({fields}))
                    .on('result', row => this.send({row: objectToCSV(row)}))
            })
        })
    }
    tryPSQL(){
      // 
    }

    send(result){
        /* emit an open event so switchboard.js can send headers. but only emit once. */
        this.readable.emit('open') 
        this.readable.push(JSON.stringify(result) + '\n')
        return result
    }

    end(result){
        /* closes the stream by pushing null byte, optionally sending one last object if passed an argument */
        result && this.readable.push(JSON.stringify(result) + '\n')
        clearInterval(this.heartbeat)        
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

function makeIterator(array) {
    var nextIndex = 0;
    return {
       next: function() {
           return nextIndex < array.length ?
               {value: array[nextIndex++], done: false} :
               {done: true};
       }
    };
}

/*
Thank you David Crockford for this public domain code that does a wonderful job of serializing objects with circular references
https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
*/
function decycle(object) {
    var objects = new WeakMap(); 
    return (function derez(value, path) {
        var old_path;   // The path of an earlier occurance of value
        var nu;         // The new object or array
        if (
            typeof value === "object" && value !== null &&
            !(value instanceof Boolean) &&
            !(value instanceof Date) &&
            !(value instanceof Number) &&
            !(value instanceof RegExp) &&
            !(value instanceof String)
        ) {
            old_path = objects.get(value);
            if (old_path !== undefined) {
                return {$ref: old_path};
            }
            objects.set(value, path);
            if (Array.isArray(value)) {
                nu = [];
                value.forEach(function (element, i) {
                    nu[i] = derez(element, path + "[" + i + "]");
                });
            } else {
                nu = {};
                Object.keys(value).forEach(function (name) {
                    nu[name] = derez(
                        value[name],
                        path + "[" + JSON.stringify(name) + "]"
                    );
                });
            }
            return nu;
        }
        return value;
    }(object, "$"));
};
