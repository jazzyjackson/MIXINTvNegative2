const fs = require('fs')
const promiseFile = filename =>
  new Promise((resolve, reject) => 
    require('fs').readFile('index/' + filename, 'utf8', (err,data) => err ? reject(err) : resolve(data)))

module.exports = async function parse(context){
  var meta = JSON.parse(await promiseFile('meta.json'))
  var environment = require('./' + meta.environment) // meta.environment is a function that returns markup when invoked
  var promiseScripts = typeof meta.globalScripts == 'string' ? [ promiseFile(meta.globalScripts) ]
                                                              : meta.globalScripts.map(filename => promiseFile(filename))
  var promiseStyles = typeof meta.styles == 'string' ? [ promiseFile(meta.styles) ]
                                                : meta.styles.map(filename => promiseFile(filename))

  var globalScripts = await Promise.all(promiseScripts)
  var styles = await Promise.all(promiseStyles)
  
  context.body = environment({globalScripts, styles})
}