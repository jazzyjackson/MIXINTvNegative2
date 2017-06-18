// window.onreadystatechange(event => )
var now = Date.now()
const fromId = document.getElementById.bind(document)
const $ = document.querySelectorAll.bind(document)
const form = fromId('form')
const input = fromId('input')
const convoContainer = fromId('convoContainer')
const textDecoder = new TextDecoder('utf8')
document.body.addEventListener('click', event => event.target === document.body && input.focus())
convoContainer.addEventListener('click', event => input.focus())
form.setAttribute('prompt', location.pathname + ` → `)

form.onsubmit = function(event){
    event.preventDefault()                              // suppress default action of reloading the page
    var messageBlock = createMessageBlock(input.value)  // create a new Div that can be appended to by async response
    evalAttempt = evalledInWindow(input.value)          // try to eval input in window first
    appendSuccess(evalAttempt, messageBlock)            // add the result of evalling to the DOM whether it succeeded or not
    if(evalAttempt.localError){                              // and if that doesn't work, ask the server if it knows what to do with this string (input.value)
        fetch(location.pathname + '?' + encodeURI(input.value), { method: 'POST' })
        .then(response => response.body ? response.body.getReader() : response.text().then( text => consumeText(text, messageBlock)))
        .then(reader => consumeStreamIfExists(reader, messageBlock))
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

function evalledInWindow(evalInput){ 
    // returns true if cannot be evalled in local scope, before passing to server
    // really should hit server with options, does this directory exist, before allowing pathname to change.
    // or mkdir before cd'ing into it. Anyway things will get weird if the working directory of a command doesnt exist
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
    // if it wasn't cd or clear, then eval it as a string
    return tryEval(evalInput)
}

function appendSuccess(resObj, parentNode){
    Object.keys(resObj).forEach(key => {
        var resultDiv = document.createElement('pre')
        resultDiv.setAttribute('msg-type', key)
        resultText = resObj[key].output || resObj[key]
        resultText = typeof resultText === 'object' ? JSON.stringify(resultText) : String(resultText) // just in case its undefined, null, or a number, coerce to string
        if(!resultText.includes('\n')) resultDiv.classList.add('oneline') // wrap lines if result is a long string. preformatted text will include new lines
        resultDiv.appendChild(document.createTextNode(resultText)) // check if result is nested object with an output property (successFul chat is this)
        parentNode.appendChild(resultDiv)
    })
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
        var success = eval(string)
        return {success: success || String(success)} //coerce falsey values to string
    } catch(localError) {
        return {localError: localError.toString()} //errors are objects but can't be parsed by JSON stringify
    }
}