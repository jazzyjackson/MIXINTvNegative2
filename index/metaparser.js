const fs = require('fs')
const readFile = filename => require('fs').readFileSync('index/' + filename, 'utf8')

const meta = JSON.parse(readFile('meta.json'));
const environment = require('./' + meta.environment) // meta.environment is a function that returns markup when invoked
const globalScripts = typeof meta.globalScripts == 'string' ? [ readFile(meta.globalScripts) ]
                                                           : meta.globalScripts.map(filename => readFile(filename))
const styles = typeof meta.styles == 'string' ? [ readFile(meta.styles) ]
                                : meta.styles.map(filename => readFile(filename))

module.exports = context => context.body = environment({styles, globalScripts})