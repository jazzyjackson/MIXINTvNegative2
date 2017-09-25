// creates a readable stream from a figtree - a configuration graph in JSON
// continuous stream that allows the browser to start painting ASAP
// but retains original file format
// I don't attempt to graph all possible HTML configurations
// just my own design - styles and scripts saved locally, + arbitrary blocks in the head
// the body is a graph 
// this version only handles a flat body, body object with properties which will be converted to divs with classname same as property name

//but by the time this code calls babel, the style and graph will have already been served, so it will be a subtle delay between page loading and page becoming active

/* an example figtree */
var fs = require('fs')
var path = require('path')
var util = require('util')

var readFile = util.promisify(fs.readFile)
var { PassThrough } = require('stream')

async function figjam(figtreeFilename, jam){ //jam, a readable stream
    /* Whatever filepath is given to figjam, assume the paths are relative to that filename, so, copy the filepath */
    var figtree = JSON.parse(await readFile(figtreeFilename)) 
    var figDirectory = figtreeFilename.split('/').slice(0,-1).join('/')
    /* push the head and the style sheets */
    jam.push('<html><head>')
    jam.push('<meta data-identity="' + process.env.user + '">' )
    jam.push('<meta process-identity="' + process.pid + '">' )
    for(var thisStyle of figtree.styles) {
        jam.push(`<style filename="${thisStyle}">\n`)
        var thisStyleFilePath = path.join(figDirectory,'gui', thisStyle)
        await promise2pipe(thisStyleFilePath, jam)
        jam.push(`</style>\n`)
    }
    /* followed by any other nodes in the head. Link, Title, Meta, etc. */
    for(var each in figtree.blocks){
        var blockName = figtree.blocks[each]        
        var blockStyle = `/gui-blocks/${blockName}/style.css`
        jam.push(`<style filename="${blockStyle}">\n`)
        await promise2pipe('.' + blockStyle, jam)
        jam.push(`</style>\n`)
    }
    for(var node in figtree.head){
        /* Can't read duplicate key names from JSON, so if you want siblings with the same tagName, have to make it an array of nodes */
        if(Array.isArray(figtree.head[node])){
            figtree.head[node].forEach(duplicate => {
                jam.push(`<${node} `)
                for(var attribute in duplicate){
                    jam.push(`${attribute}="${duplicate[attribute]}" `)
                }
                jam.push(`></${node}>\n`)
            })
        } else {
            jam.push(`<${node} `)
            for(var attribute in figtree.head[node]){
                jam.push(`${attribute}="${figtree.head[node][attribute]}" `)
            }
            jam.push(`></${node}>\n`)
        }
    }
    /* finished with head. Render the graph of the body object */
    jam.push('</head>\n<body>\n')
    for(var block in figtree.body){
        jam.push(`<${block}`)
        for(var attribute in figtree.body[block]){
            jam.push(` ${attribute}="${figtree.body[block][attribute]}"`)
        }
        jam.push(`></${block}>\n`)
    }
    /* before ending the body tag, append a script tag for every javascript file */
    jam.push('<block-templates>')
    for(var each in figtree.blocks){
        var blockName = figtree.blocks[each]
        var blockTemplate = path.join(figDirectory, 'gui-blocks', blockName,'template.html')
        jam.push(`<template renders="${blockName}-block" filename="${blockTemplate}">`)
        await promise2pipe(blockTemplate, jam)
        jam.push(`</template>`)
    }
    jam.push('</block-templates>')
    
    /* instead of appending separate script tags, read the list of names, */
    /* future script tags re-declaring classes will simply override earlier declarations, and if the file is saved, it will be pulled from disk in its newest version */
    jam.push(`<block-classes><script id="block-definitions">\n`)
    for(var each in figtree.blocks){
        var blockName = figtree.blocks[each]        
        var blockClass = path.join(figDirectory, 'gui-blocks', blockName,'class.js')
        /* if you needed to transpile, this is a good place
        just launch a child process to run Babel on the script and push that */
        await promise2pipe(blockClass, jam)
        jam.push('\n')
    }
    jam.push(`</script></block-classes>\n`)
    for(var thisScript of figtree.scripts){
        jam.push(`<script filename="${thisScript}">\n`)
        var thisScriptFilePath = path.join(figDirectory,'gui-blocks',thisScript)
        /* if you needed to transpile or add polyfill, this is a good place
        just launch a child process to run Babel on the script and push that */
        await promise2pipe(thisScriptFilePath, jam)
        jam.push(`</script>\n`)
    }

    jam.push('</body>\n</html>')
    jam.push(null)
}

function promise2pipe(filename, readable){
    return new Promise((resolve, reject) => {
        fs.createReadStream(filename)
            .on('end', resolve)
            .on('error', error => {
                /* if the file doesn't exist that's fine, keep going */
                error.code == 'ENOENT' ? resolve() : reject(error)
            })
            .pipe(readable, {end: false})

    })
}

var figjamCalledDirectly = process.argv[1].split(path.sep).slice(-1)[0] == 'figjam'

if(figjamCalledDirectly && process.argv[2]){
    var jam = new PassThrough
    figjam(process.argv[2], jam)
    jam.pipe(process.stdout)
}

module.exports = filename => {
    var jam = new PassThrough
    // can I fire an open event?
    figjam(filename, jam)
    return jam
}