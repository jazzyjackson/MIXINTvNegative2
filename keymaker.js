/* keymaker */

const https = require('https')
const keyStore = {
    '0': 'nobody'
} // only exists as a local cache so I don't have to fetch profile every time
const serverSelect = {
    /* serverSelect fills out variables for local, qa, and prod environments for authorization and redirect. 
     * hostname + pathname + query is used to redirect to another page if I'm unable to authorize you
     * checkAuthDomain and cookieDomain are only necessary if you have qa and prod servers on different domains */
    localhost: {
        hostname: '',
        pathname: '/',
        query: '?key=0', 
        checkAuthDomain: '', 
        cookieDomain: ''
    },
}

const { hostname, pathname, query, checkAuthDomain, cookieDomain } = serverSelect['localhost'] // select localhost, qa, or prod

var formatCookie = key => 'key=' + key + ';Path=/;Domain=' + cookieDomain

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
        default: request.environment = {
                cwd: 'root',
                env: {
                    bot: 'harry',
                    user: request.userid,
                    PATH: process.env.PATH,
                    interpretMode: 'bashFirst'
                }
            }
    }
}

module.exports = { identify, keyStore, setEnvironment, allow, redirurl: hostname + pathname + query }
/* private functions */

function findKey(string){
    var extractKey = /key=([0-9A-F]+)/
    var key = extractKey.exec(string)
    // if key is null return null, else, the key was found, and is sitting at index 1 of the regex object
    return key && key[1] 
}

function checkAuth(key){
    // checkAuth is where you could see if a session is invalidated, check a database for a user session etc
    return(Boolean(keyStore[key]))
    // return a promise if you want to do anything async 
    // return new Promise(resolve => resolve(Boolean(keyStore[key])))
}

function allow(username){
    var key = Math.random().toString(16).slice(2).toUpperCase() // -> something like '2a87f3e7c5e1b'
    keyStore[key] = username
    return key
}

/* promises checkAuth and getFullName request JSON data from SSO */
// function checkAuth(key){
//     return new Promise((resolve,reject) => {
//         https.get(checkAuthDomain + 'your_auth_api_here' + key, response => {
//             var resBuffers = []
//             response.on('data', data => resBuffers.push(data))
//             response.on('end', () => {
//                 var result = JSON.parse(Buffer.concat(resBuffers).toString())
//                 resolve(result.isAuthorized == true) // cuz the API sends true or 'false' (String), I want to return true or false (Bool)
//             })
//         }).on('error', error => {
//             reject(error.code)
//         })
//     })
// }

// function getFullName(key){
//     return new Promise((resolve,reject) => {
//         https.get(checkAuthDomain + 'your_profile_api_here' + key, response => {
//             var resBuffers = []
//             response.on('data', data => resBuffers.push(data))
//             response.on('end', () => {
//                 var result = JSON.parse(Buffer.concat(resBuffers).toString())
//                 resolve(result.fullName) 
//             })
//         }).on('error', error => {
//             reject(error.code)
//         })
//     })
// }