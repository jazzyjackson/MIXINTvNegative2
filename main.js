const Koa = require('koa')
const fs = require('fs')
const app = new Koa()

app.use(async (context, next) => {
  context.body = await ({
    'GET': function(){
        return new Promise((resolve, reject) => fs.readFile('.' + context.path, (err, data) => {
          if (err) reject (err)
          else resolve(data.toString())
        }))
    },
    'POST': () => {
      console.log('posted')
    },
    'DELETE': () => {
      console.log('deleted')
    },
    'PUT': () => {
      console.log('putted')
    },
  })[context.method]()
})


app.listen(3000)