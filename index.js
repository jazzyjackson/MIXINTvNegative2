const fromId = document.getElementById.bind(document)
const $ = document.querySelectorAll.bind(document)
const form = fromId('form')
const input = fromId('input')
const convoContainer = fromId('convoContainer')

form.onsubmit = event => {
    event.preventDefault()
    convoContainer.insertBefore(parseHTML("<div class='input'>" + input.value + "</div>"),form)
    form.scrollIntoView()

    fetch('/?' + encodeURI(input.value), {
      method: 'POST'
    }).then(response => {
      return response.text()
    }).then(result => {
      console.log(result)
      // result = ((result.successfulChat && result.successfulChat.output) || result.successEval || result.successBash )
      console.log(result)
      
      convoContainer.insertBefore(parseHTML("<div class='output'>" + result + "</div>"),form)
      form.scrollIntoView()
      
    })

    input.value = ''
    
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