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
    var now = new Date()
    var logInfo = {
        ztime: now,
        userid: request.userid,
        method: request.method,
        path:   request.url.split('?')[0],
        query:  decodeURI(request.url.split('?')[1]),
        ipaddr: request.connection.remoteAddress,
        responseSize: 0,
        requestSize: 0
    }

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
        logInfo.ms = new Date() - logInfo.ztime //roundtrip time
        logInfo.status = response.statusCode
        var cpuTotal = process.cpuUsage()
        logInfo.cpu = (cpuTotal.user + cpuTotal.system) / 1000 // milliseconds spent holding the processor
        logInfo.rss = process.memoryUsage().rss / 1000000
        appendLog(request.userid, 'traffic', JSON.stringify(logInfo))
        // could be a good place to start git operations if method = PUT. Have access to path...
    })

    return {watchRequest, watchResponse}
}

function appendLog(username, logType, data){
    var now = new Date()
    var filename = logType + '-' + now.getFullYear() + '-' + (now.getMonth() + 1) +'-' + now.getDate() + '.log' // since left most expression returns string, all the numbers will get stringified instead of summed
    fs.appendFile(`./logs/${username}/${filename}`, data + os.EOL, err => {
            if(err && err.code == 'ENOENT'){
                // block thread if the user directory didn't exist, this only needs to happen once. Sync so it's done by the time the next request tries to write.
                fs.mkdirSync(`./logs/${username}`)
                fs.appendFileSync(`./logs/${username}/${filename}`, data + os.EOL)
            }
    })
}


module.exports = {observe, logError, appendLog}