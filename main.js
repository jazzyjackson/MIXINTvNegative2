const Koa = require('koa')
const app = new Koa()

app.use(require('./editor/metaparser'))
app.use(require('./root/metaparser'))
app.listen(3000)