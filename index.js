const fromId = document.getElementById.bind(document)
const $ = document.querySelectorAll.bind(document)
const form = fromId('form')
const input = fromId('input')
const convoContainer = fromId('convoContainer')
const textDecoder = new TextDecoder('utf8')
form.setAttribute('prompt', location.pathname + ` →`)

form.onsubmit = function(event){
    event.preventDefault()
    form.scrollIntoView()
    var messageBlock = createMessageBlock(input.value)
    if(!specialMessage(input.value)){
        fetch(location.pathname + '?' + encodeURI(input.value), { method: 'POST' })
        .then(response => response.body ? response.body.getReader() : response.text().then( text => consumeText(text, messageBlock)))
        .then(reader => consumeStreamIfExists(reader, messageBlock))
        input.value = ''
    }

    
}

function consumeStreamIfExists(reader, parentNode){
    if(!reader) return null
    return reader.read().then(sample => {
        if(sample.value){
            chunk = textDecoder.decode(sample.value)
            chunk.split(/\n(?={)/g).forEach(JSONchunk => appendSuccess(JSON.parse(JSONchunk), parentNode))
            return consumeStreamIfExists(reader, parentNode)
        }
    })
}

function specialMessage(evalInput){
    if(input.value.indexOf('cd') == 0){
        console.log(input.value)
        newDir = input.value.slice(3).trim()
        console.log(newDir)
        if(newDir == '.') return true
        if(newDir == '..'){
            var newPath = location.pathname.split('/')
            newPath.pop()
            newPath.pop()
            newPath = newPath.join('/') + '/' 
            location.pathname = newPath
            return true
            //new url is the rest of the string after you slice off the first slash and slice after the second slash
        }
        if(newDir == '~'){
            location.pathname = '' 
            return true
        }
        if(/[^\\/]/.test(newDir)){
            //if the last character is a black slash or forwardslash, and the first character is not,
            //append the new path to the pathname
            location.pathname += /\\\/\$/.test(newDir) ? newDir : newDir + '/'
            return true
        } else if (/^[\\/]/.test(newDir)){
            //if the first character is a slash
            location.pathname = /\\\/\$/.test(newDir) ? newDir : newDir + '/'
            return true
        }
    }
    if(input.value.trim() == 'clear'){
        Array.from(document.querySelectorAll('.messageBlock'), node => node.remove())
        return true
    }
}

function consumeText(text, parentNode){
    text.split(/\n(?={)/g).forEach(JSONchunk => appendSuccess(JSON.parse(JSONchunk), parentNode))
}

function appendSuccess(resObj, parentNode){
    console.log(parentNode)
    //result is whatever one of these exists
    var result = resObj.bashData || (resObj.successfulChat && resObj.successfulChat.output) 
                                 || resObj.successEval 
                                 || '' // resObj.successBash // successBash is just 0, so, it probably doesn't need to be printed.'
    var resultDiv = document.createElement('pre')
    resultDiv.appendChild(document.createTextNode(result))
    parentNode.appendChild(resultDiv)
    form.scrollIntoView()
    
}

function createMessageBlock(inputMessage){
    var messageBlock = document.createElement('div')
    messageBlock.id = Date.now().toString(16)
    messageBlock.className = 'messageBlock'
    var inputDiv = document.createElement('pre')
    inputDiv.className = 'input'
    inputDiv.appendChild(document.createTextNode(form.getAttribute('prompt') + ' ' + inputMessage))
    messageBlock.appendChild(inputDiv)
    convoContainer.insertBefore(messageBlock, form)
    form.setAttribute('prompt', location.pathname + ` →`)
    form.scrollIntoView()
    return messageBlock
    //push history could be used to change the pathname without reloading the page, making this functionality actually useful

}


function parseHTML(string){
    var tempNode = document.createElement('div')
    tempNode.innerHTML = string
    return tempNode.firstChild
}
function tryEval(string){
    try {
        return eval(string)
    } catch(e) {
        return 'Error'
    }
}
