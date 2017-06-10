const fromId = document.getElementById.bind(document)
const $ = document.querySelectorAll.bind(document)
const form = fromId('form')
const input = fromId('input')
const convoContainer = fromId('convoContainer')
const textDecoder = new TextDecoder('utf8')
document.body.addEventListener('click', event => event.target === document.body && input.focus())
form.setAttribute('prompt', location.pathname + ` →`)

form.onsubmit = function(event){
    event.preventDefault()
    var messageBlock = createMessageBlock(input.value)
    let evalAttempt = evalledInWindow(input.value)
    if(evalAttempt.error){
        console.error(evalAttempt.error)
        fetch(location.pathname + '?' + encodeURI(input.value), { method: 'POST' })
        .then(response => response.body ? response.body.getReader() : response.text().then( text => consumeText(text, messageBlock)))
        .then(reader => consumeStreamIfExists(reader, messageBlock))
    } else {
        appendSuccess({successEval: evalAttempt.success}, messageBlock)
    }
    input.value = ''
}


function consumeText(text, parentNode){
    text.split(/\n(?={)/g).forEach(JSONchunk => appendSuccess(JSON.parse(JSONchunk), parentNode))
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

function evalledInWindow(evalInput){ // returns true if cannot be evalled in local scope, before passing to server
    if(input.value.indexOf('cd') == 0){
        console.log(input.value)
        newDir = input.value.slice(3).trim()
        console.log(newDir)
        if(newDir == '.') return {success: 'OK'}
        if(newDir == '..'){
            var newPath = location.pathname.split('/')
            newPath.pop()
            newPath.pop()
            newPath = newPath.join('/') + '/' 
            location.pathname = newPath
            return {success: 'OK'}
            //new url is the rest of the string after you slice off the first slash and slice after the second slash
        }
        if(newDir == '~'){
            location.pathname = '' 
            return {success: 'OK'}
        }
        if(/[^\\/]/.test(newDir)){
            //if the last character is a black slash or forwardslash, and the first character is not,
            //append the new path to the pathname
            location.pathname += /\\\/\$/.test(newDir) ? newDir : newDir + '/'
            return {success: 'OK'}
        } else if (/^[\\/]/.test(newDir)){
            //if the first character is a slash
            location.pathname = /\\\/\$/.test(newDir) ? newDir : newDir + '/'
            return {success: 'OK'}
        }
    }
    if(input.value.trim() == 'clear'){
        Array.from(document.querySelectorAll('.messageBlock'), node => node.remove())
        return {success: 'OK'}
    }
    return tryEval(evalInput) //if not special message, return try eval
}


function appendSuccess(resObj, parentNode){
    //result is whatever one of these exists
    var result = resObj.bashData || (resObj.successfulChat && resObj.successfulChat.output) 
                                 || resObj.successEval 
                                 || (resObj.successBash !== undefined) && ('exit code ' + resObj.successBash)
                                 ||`chatErr: ${JSON.stringify(resObj.chatErr)}\nbashErr: ${resObj.bashErr.replace(/[\n\r]/g,'')}\nnodeErr: ${resObj.evalErr}`
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
    inputDiv.appendChild(document.createTextNode(form.getAttribute('prompt').trim() + ' ' + inputMessage))
    messageBlock.appendChild(inputDiv)
    convoContainer.insertBefore(messageBlock, form)
    form.setAttribute('prompt', location.pathname + ` → `)
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
        return {success: eval(string)}
    } catch(e) {
        return {error: e.toString()}
    }
}