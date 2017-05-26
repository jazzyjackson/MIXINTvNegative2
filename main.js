const Koa = require('koa')
const router = require('koa-route')
const app = new Koa()

app.use(router.get('/', require('./index/metaparser')))
app.listen(3000)