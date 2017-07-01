/*
Bookkeeper keeps busy, intercepting all proxy'd streamed, it does a few things for every chunk of data: 
- record current memory and cpu usage of associated process
- sum bandwidth up, each chunk will have a length proerty, sum sum sum until end, then record the data transfer
- on PUT, intercept the x-commmit-message header, the PUT socket isn't closed until the file is closed, so you should be able to watch for the end event, and then git commit.
*/

function logError(userid, error){
    // hopefully there's not enough errors for blocking to be a big deal
    // appendFileSync allows us to write to file even when the program has been requested to exit. Sync write THEN exit.
    fs.appendFileSync('./logs/error.log', JSON.stringify({
        ztime: new Date(),
        userid: userid, 
        error: util.inspect(error || "undefined error")
    }) + os.EOL)
}

/***** Handle shell hang ups and uncaught errors. SIGHUP is when shell exits, SIGINT is ^-C ***/

// process.on('SIGHUP', error => logError('system', 'SIGHUP'))
// process.on('SIGINT', error => logError('system', 'SIGINT') || process.exit())
// process.on('uncaughtException',  error => logError('system', error)) // && process.exit() here if you want to
var stream = require('stream')
var fs = require('fs')
var os = require('os')
var util = require('util')

function observe(request, response){
    var logInfo = {
        ztime: new Date().toISOString(),
        userid: request.userid,
        method: request.method,
        path:   request.url.split('?')[0],
        query:  decodeURI(request.url.split('?')[1]),
        ipaddr: request.connection.remoteAddress,
        responseSize: 0,
        requestSize: 0
    }
    var starttime = Date.now()

    var watchRequest = new stream.Transform({
        transform: function(chunk, encoding, done){
            this.push(chunk)
            logInfo.requestSize += chunk.length,
            done()            
        }
    })

    var watchResponse = new stream.Transform({
        transform: function(chunk, encoding, done){
            this.push(chunk)
            logInfo.responseSize += chunk.length,
            done()            
        }
    })
    
    watchResponse.on('end', () => {
        logInfo.ms = Date.now() - starttime
        logInfo.status = response.statusCode        
        fs.appendFile(`./logs/responses.log`, JSON.stringify(logInfo) + os.EOL, () => undefined)
    })

    return {watchRequest, watchResponse}
}


module.exports = {observe, logError}