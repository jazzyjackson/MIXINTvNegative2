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
    return request.userid = 'nobody'
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
    // maybe have the option for priveledged users to request a certain working directory, to switch what application you're in
    // from within the application
    var sphinx = {
        cwd: './branches/sphinx/', 
        env: { bot: 'harry', user: request.userid, convoMode: 'botFirst' }
    }
    var rootEnvironment = {
        cwd: './branches/root/', 
        env: { bot: 'harry', cuser: request.userid, onvoMode: 'bashFirst' }
    }

    var defaultEnvironment = {
        cwd: './branches/root/', 
        env: { bot: 'harry', user: request.userid, convoMode: 'botFirst' }
    }


    switch(request.userid){
        case 'nobody': request.environment = sphinx; break;
        case 'root': request.environment = rootEnvironment; break;
        default: request.environment = defaultEnvironment;
    }

    request.environment.env.PATH = process.env.PATH
}