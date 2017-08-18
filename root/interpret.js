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
            bashFirst: [this.tryBash, this.tryEval, this.tryChat]
        }[process.env.interpretMode])
        this.iterateTilSuccess(this.promiseChain.next())
    }

    iterateTilSuccess(whatsNext){
        if(whatsNext.done) return this.end()
        whatsNext.value.call(this, this.string2interpret) // use call in case function ref in array lost its context
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
            if(!input) return resolve()
            if(input.indexOf('what') == 0) return reject({bashReject: 'unixy systems have a what program that hangs the shell without an argument'})
            if(!input.trim()) return reject({bashReject: `Blank line doesn't mean anything`})
            if(input[0] == ':') return reject({bashReject: ': is no-op in bash! input will be ignored, no error thrown'})
            var processpipe = exec(input, {cwd: this.options.cwd || '.'})
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
                this.send({evaldata: JSON.stringify(decycle(eval(input)),'',4)})
                resolve(input)
            }
            catch(err){ 
                reject({evalErr: err.toString()}) 
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
    cycle.js
    2017-02-07

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

// The file uses the WeakMap feature of ES6.

/*jslint es6, eval */

/*property
    $ref, decycle, forEach, get, indexOf, isArray, keys, length, push,
    retrocycle, set, stringify, test
*/

function decycle(object) {
        "use strict";

// Make a deep copy of an object or array, assuring that there is at most
// one instance of each object or array in the resulting structure. The
// duplicate references (which might be forming cycles) are replaced with
// an object of the form

//      {"$ref": PATH}

// where the PATH is a JSONPath string that locates the first occurance.

// So,

//      var a = [];
//      a[0] = a;
//      return JSON.stringify(JSON.decycle(a));

// produces the string '[{"$ref":"$"}]'.

// If a replacer function is provided, then it will be called for each value.
// A replacer function receives a value and returns a replacement value.

// JSONPath is used to locate the unique object. $ indicates the top level of
// the object or array. [NUMBER] or [STRING] indicates a child element or
// property.

        var objects = new WeakMap();     // object to path mappings

        return (function derez(value, path) {

// The derez function recurses through the object, producing the deep copy.

            var old_path;   // The path of an earlier occurance of value
            var nu;         // The new object or array


// typeof null === "object", so go on if this value is really an object but not
// one of the weird builtin objects.

            if (
                typeof value === "object" && value !== null &&
                !(value instanceof Boolean) &&
                !(value instanceof Date) &&
                !(value instanceof Number) &&
                !(value instanceof RegExp) &&
                !(value instanceof String)
            ) {

// If the value is an object or array, look to see if we have already
// encountered it. If so, return a {"$ref":PATH} object. This uses an
// ES6 WeakMap.

                old_path = objects.get(value);
                if (old_path !== undefined) {
                    return {$ref: old_path};
                }

// Otherwise, accumulate the unique value and its path.

                objects.set(value, path);

// If it is an array, replicate the array.

                if (Array.isArray(value)) {
                    nu = [];
                    value.forEach(function (element, i) {
                        nu[i] = derez(element, path + "[" + i + "]");
                    });
                } else {

// If it is an object, replicate the object.

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

function retrocycle($) {
        "use strict";

// Restore an object that was reduced by decycle. Members whose values are
// objects of the form
//      {$ref: PATH}
// are replaced with references to the value found by the PATH. This will
// restore cycles. The object will be mutated.

// The eval function is used to locate the values described by a PATH. The
// root object is kept in a $ variable. A regular expression is used to
// assure that the PATH is extremely well formed. The regexp contains nested
// * quantifiers. That has been known to have extremely bad performance
// problems on some browsers for very long strings. A PATH is expected to be
// reasonably short. A PATH is allowed to belong to a very restricted subset of
// Goessner's JSONPath.

// So,
//      var s = '[{"$ref":"$"}]';
//      return JSON.retrocycle(JSON.parse(s));
// produces an array containing a single element which is the array itself.

        var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

        (function rez(value) {

// The rez function walks recursively through the object looking for $ref
// properties. When it finds one that has a value that is a path, then it
// replaces the $ref object with a reference to the value that is found by
// the path.

            if (value && typeof value === "object") {
                if (Array.isArray(value)) {
                    value.forEach(function (element, i) {
                        if (typeof element === "object" && element !== null) {
                            var path = element.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(element);
                            }
                        }
                    });
                } else {
                    Object.keys(value).forEach(function (name) {
                        var item = value[name];
                        if (typeof item === "object" && item !== null) {
                            var path = item.$ref;
                            if (typeof path === "string" && px.test(path)) {
                                value[name] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    });
                }
            }
        }($));
        return $;
    };
