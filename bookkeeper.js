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

function logRequest(request){
    //host will be like guest.localhost.com. Split domain, slice off trailing dot, use no-user if that's an empty string.
    var userid = request.headers.host.split(hostname)[0].slice(0,-1) || 'no-user' 
    fs.appendFile(`./logs/${userid}.log`, JSON.stringify({
        userid: userid, 
        method: request.method,
        path:   request.url.split('?')[0],
        query:  decodeURI(request.url.split('?')[1]),
        ipaddr: request.connection.remoteAddress,
        ztime: new Date()
    }) + os.EOL, () => undefined)
}
