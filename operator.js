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
    } else {
        bookkeeper.observe(request, response) /* stateless branch only */
        switchboard(request, response) /* stateless branch only */
    }
}).listen(process.env.PORT || 3000)