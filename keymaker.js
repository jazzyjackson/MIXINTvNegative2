/* keymaker */

const https = require('https')
const keyStore = {} // only exists as a local cache so I don't have to fetch profile every time
const serverSelect = {
    localhost: {
        hostname: 'https://qaapps.annalect.com',
        pathname: '/extsso',
        query: '?resourcekey=anlabs_utility_bot&redirurl=http://localhost:3000/',
        checkAuthDomain: 'https://qaaccess.annalect.com',
        cookieDomain: 'localhost'
    },
    qa: {
        hostname: 'https://qaapps.annalect.com',
        pathname: '/extsso',
        query: '?resourcekey=anlabs_utility_bot&redirurl=https://qautilitybot.annalect.com/',
        checkAuthDomain: 'https://qaaccess.annalect.com',
        cookieDomain: 'qautilitybot.annalect.com'
    },
    prod: {
        hostname: 'https://apps.annalect.com',
        pathname: '/extsso',
        query: '?resourcekey=anlabs_utility_bot&redirurl=https://utilitybot.annalect.com/',
        checkAuthDomain: 'https://access.annalect.com',
        cookieDomain: 'utilitybot.annalect.com'
    }
}

const { hostname, pathname, query, checkAuthDomain, cookieDomain } = serverSelect['localhost'] // select localhost, qa, or prod

var formatCookie = key => 'ANsid=' + key + ';Path=/;Domain=' + cookieDomain

async function identify(request, response){
    /* first check if there is a key in the cookie or in the url. If not, exit.  */
    var key = findKey(request.url) || findKey(request.headers.cookie)
    if(!key) return key

    /* wait for SSO to verify that a given key is still valid / logged in, if not, erase key from cookie and exit */
    var isAuthorized = await checkAuth(key)
    if(!isAuthorized) return response.setHeader('set-cookie', formatCookie(null)) //null will get stringified, but wont match /[0-9A-F]+/ so it's effectively null
                                                                                  //since Path and Domain are set to be identical on all cookies, this will overwrite
    /* check keyStore, if I know who are you, great, make sure key is on cookie and exit */
    request.userid = keyStore[key]
    if(request.userid) return response.setHeader('set-cookie', formatCookie(key))

    /* if you've got a good key, but I didn't know who you are, get profile, and put you in the keyStore, set cookie, and exit */
    request.userid = keyStore[key] = await getFullName(key)
    return response.setHeader('set-cookie', formatCookie(key))
}


function setEnvironment(request){
    // if you want to change the environment variables interpret has access to, this is the place to do it
    // bash scripts and sub processes will be spawned in this environment, so you can stick variables and credentials in here
    // but mostly it's a place to stick the username so Aubi knows who its talking to
    // different usernames could be directed to different bots here
    /* stateless sets chat properties on request object, timeshare sets environment variables for subprocess */
    switch(request.userid){
        default: Object.assign(request, {
                bot: 'aubi',
                user: request.userid
            })
    }
}

module.exports = { identify, keyStore, setEnvironment, redirurl: hostname + pathname + query }
/* private functions */

function findKey(string){
    var extractKey = /ANsid=([0-9A-F]+)/
    var key = extractKey.exec(string)
    // if key is null return null, else, the key was found, and is sitting at index 1 of the regex object
    return key && key[1] 
}

/* promises checkAuth and getFullName request JSON data from SSO */
function checkAuth(ANsid){
    return new Promise((resolve,reject) => {
        https.get(checkAuthDomain + '/am/amapi/user/session/' + ANsid, response => {
            var resBuffers = []
            response.on('data', data => resBuffers.push(data))
            response.on('end', () => {
                var result = JSON.parse(Buffer.concat(resBuffers).toString())
                resolve(result.isAuthorized == true) // cuz the API sends true or 'false' (String), I want to return true or false (Bool)
            })
        }).on('error', error => {
            reject(error.code)
        })
    })
}

function getFullName(ANsid){
    return new Promise((resolve,reject) => {
        https.get(checkAuthDomain + '/am/amapi/user/profile_core/' + ANsid, response => {
            var resBuffers = []
            response.on('data', data => resBuffers.push(data))
            response.on('end', () => {
                var result = JSON.parse(Buffer.concat(resBuffers).toString())
                resolve(result.fullName) 
            })
        }).on('error', error => {
            reject(error.code)
        })
    })
}