// creates a readable stream from a figtree - a configuration graph in JSON
// continuous stream that allows the browser to start painting ASAP
// but retains original file format

//but by the time this code calls babel, the style and graph will have already been served, so it will be a subtle delay between page loading and page becoming active

/* an example figtree */
var fs = require('fs')
var path = require('path')
var Readable = require('stream').Readable

function figjam(figtreeFilename){
    var figtree = JSON.parse(fs.readFileSync(figtreeFilename))
    var figDirectory = figtreeFilename.split('/').slice(0,-1).join('/')
    var jam = new Readable
    jam.push('<html><head>')

    figtree.styles.forEach(styleFilename => {
        jam.push(`<style filename=${styleFilename}>\n`)
        jam.push(fs.readFileSync(path.join(figDirectory,'gui',styleFilename)))
        jam.push(`</style>\n`)
    })

    for(var node in figtree.head){
        jam.push(`<${node} `)
        for(var attribute in figtree.head[node]){
            jam.push(`${attribute}="${figtree.head[node][attribute]}" `)
        }
        jam.push(`/>\n`)
    }

    for(var block in figtree.body){
        jam.push(`<div class="${block}"`)
        for(var attribute in figtree.body[block]){
            jam.push(` ${attribute}="${figtree.body[block][attribute]}"`)
        }
        jam.push(`></div>\n`)
    }

    jam.push(null)
    return jam
}

if(process.argv[2]){
    figjam(process.argv[2]).pipe(process.stdout)
}

module.exports = figjam