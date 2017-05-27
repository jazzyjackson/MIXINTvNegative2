const fs = require('fs')
const promiseFile = filename =>
  new Promise((resolve, reject) => 
    require('fs').readFile('root/' + filename, 'utf8', (err,data) => err ? reject(err) : resolve(data))).catch(err => console.log(`Error opening ${filename}: ${err.code}`))

let promises = new config() // create an empty object for promises.

function config(){
  this.meta = JSON.parse(fs.readFileSync('root/meta.json'))
  delete require.cache[require.resolve('./' + this.meta.template)] //clear possible cache of the template file.
  this.template = require('./' + this.meta.template) // this.meta.template is a function that returns markup when invoked
  this.scripts = typeof this.meta.globalScripts == 'string' ? [ promiseFile(this.meta.globalScripts) ]
                                                       : this.meta.globalScripts.map(filename => promiseFile(filename))
  this.styles = typeof this.meta.styles == 'string' ? [ promiseFile(this.meta.styles) ]
                                               : this.meta.styles.map(filename => promiseFile(filename))
}

async function bundle(context){
  var {scripts, styles, template, meta} = promises
  var globalScripts = await Promise.all(scripts)
  var styles = await Promise.all(styles)
  return context.body = template({globalScripts, styles, meta})
}

module.exports = async function route(context, next){
  if(context.body) return await next(); // if a body has already been written, exit this route.
  if(context.path = '/') await bundle(context)
  await next()
}

// whenever any file changes, refill config with promises to read all files.
// this can be optimized so that the config file is read & diffed, reloading only files for properties that changed, etc.
fs.watch('root', (event, filename) => {
  promises = new config() //will call when files are saved instead of watching the drive
})