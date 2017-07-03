const userKeys = {}

module.exports = { identify, allow, userKeys, unlockEnvironmentFor }

function identify(request, response){
    var userFromCookie = testKey(findKey(request.headers.cookie))
    if(userFromCookie) return request.userid = userFromCookie
    var userFromQuery = testKey(findKey(request.url))
    if(userFromQuery){
        // response.writeHeader('set-cookie','key=; Path=%x2F; HttpOnly; Expires=0') // erase any old keys
        response.setHeader('set-cookie','key=' + findKey(request.url) )//+ '; Path=%x2F; HttpOnly')
        return request.userid = userFromQuery
    }
}



function allow(username){
    var yourKey = Math.random().toString(16).slice(2)
    userKeys[yourKey] = username
    return yourKey
}

function findKey(string){
    //search for hexadecimal sequence after 'key='
    var extractKey = /key=([0-9a-f]+)/
    var key = extractKey.exec(string)
    // if key is not null, the key was found, and is sitting at index 1 of the regex object
    return key && key[1] 
    // otherwise return null.
}

function testKey(key){
    if(!key) return key //if key is null, return null
    return userKeys[key] // otherwise return user associated with key
}

function unlockEnvironmentFor(request){
    const BashFirst = 'bashFirst'
    const BotFirst = 'botFirst'

    switch(request.userid){
        case 'root': Object.assign(request, { destination: '/branches/root/', bot: 'shelly', convoMode: BashFirst}); break;
        default: Object.assign(request, { destination: '/branches/root/', bot: 'shelly', convoMode: BotFirst });
    }
}