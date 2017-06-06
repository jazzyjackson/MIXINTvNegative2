const fromId = document.getElementById.bind(document)
const $ = document.querySelectorAll.bind(document)
const form = fromId('form')
const input = fromId('input')
const convoContainer = fromId('convoContainer')

form.onsubmit = function(event){
    event.preventDefault()
    form.scrollIntoView()
    var messageBlock = createMessageBlock(input.value)
    fetch('./?' + encodeURI(input.value), {
      method: 'POST'
    })
    .then(response => response.body ? response.body.getReader() : response.text().then( text => consumeText(text, messageBlock)))
    .then(reader => consumeStreamIfExists(reader, messageBlock))
    input.value = ''
    
}

function consumeStreamIfExists(reader, parentNode){
    if(!reader) return null
    return reader.read().then(sample => {
        if(sample.value){
            chunk = new TextDecoder('utf8').decode(sample.value)
            chunk.split(/\n(?={)/g).forEach(JSONchunk => appendSuccess(JSON.parse(JSONchunk), parentNode))
            return consumeStreamIfExists(reader, parentNode)
        }
    })
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
    var inputDiv = document.createElement('pre')
    inputDiv.className = 'input'
    inputDiv.appendChild(document.createTextNode(inputMessage))
    messageBlock.appendChild(inputDiv)
    convoContainer.insertBefore(messageBlock, form)
    console.log(messageBlock) 
    return messageBlock
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