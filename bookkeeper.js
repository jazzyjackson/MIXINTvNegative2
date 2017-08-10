var stream = require('stream')
var fs = require('fs')
var os = require('os')
var util = require('util')
var execSync = require('child_process').execSync

/***** Handle shell hang ups and uncaught errors. SIGHUP is when shell exits, SIGINT is ^-C ***/

process.on('SIGHUP', error => logError('system', 'SIGHUP'))
process.on('SIGINT', error => logError('system', 'SIGINT') || process.exit())
process.on('uncaughtException',  error => logError('system', error)) // && process.exit() here if you want to

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
    
    response.on('finish', () => {
        logInfo.ms = new Date() - logInfo.ztime //roundtrip time
        logInfo.status = response.statusCode
        var cpuTotal = process.cpuUsage()
        logInfo.cpu = (cpuTotal.user + cpuTotal.system) / 1000 // microseconds / 1000 = milliseconds spent holding the processor
        logInfo.rss = process.memoryUsage().rss / 1000000 // divide by a million, bytes -> megabytes
        Object.keys(logInfo).forEach(each => logInfo[each] || delete logInfo[each]) // if logInfo[each] is falsey, delete it
        appendLog(request.userid, 'traffic', JSON.stringify(logInfo))
        // could be a good place to start git operations if method = PUT. Have access to path...
    })
}

function appendLog(username, logType, data){
    var now = new Date()
    var filename = logType + '-' + now.getFullYear() + '-' + (now.getMonth() + 1) +'-' + now.getDate() + '.log' // since left most expression returns string, all the numbers will get stringified instead of summed
    
    if(logType == 'error'){
        try {
            fs.appendFileSync(`./logs/${username}/${filename}`, data + os.EOL)
        } catch(err) {
            if(err && err.code == 'ENOENT'){
                fs.mkdirSync(`./logs/${username}`)
                fs.appendFileSync(`./logs/${username}/${filename}`, data + os.EOL)
            }
        }
    }
    else fs.appendFile(`./logs/${username}/${filename}`, data + os.EOL, err => {
        if(err && err.code == 'ENOENT'){
            // block thread if the user directory didn't exist, this only needs to happen once. 
            // Sync so it's done by the time the next request tries to write.
            fs.mkdirSync(`./logs/${username}`)
            fs.appendFileSync(`./logs/${username}/${filename}`, data + os.EOL)
        }
    })
}

function logError(userid, error){
    /*** you can choose to expose errors in the console or not */
    console.log(error.toString())
    appendLog(userid, 'error', JSON.stringify({
        ztime: new Date(),
        userid: userid,
        version: execSync('git rev-parse HEAD').toString().slice(0,6),
        error: error.toString()
    }) + os.EOL)
}


module.exports = {observe, logError, appendLog}