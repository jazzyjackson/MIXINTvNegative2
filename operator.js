var http   = require('http')
var bookkeeper = require('./bookkeeper')
var keymaker = require('./keymaker')
var switchboard = require('./root/switchboard')

http.createServer(async (request, response) => {
	await keymaker.identify(request, response)
	keymaker.setEnvironment(request)
	if( request.userid == undefined ){
        response.writeHead(302, { 'Location': keymaker.redirurl })
        response.end()
    } else if(request.url.includes('key')){
        response.writeHead(302, { 'Location': '//' + request.headers.host })
        response.end()
    } else {
        bookkeeper.observe(request, response)
        switchboard(request, response)
    }
}).listen(process.env.PORT || 3000)