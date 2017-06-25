const textDecoder = new TextDecoder('utf8')

class ConvoBlock extends Block {
    constructor(options){
        super(Object.assign({
            class: "convoBlock",
            title: location.hostname + location.pathname
        },options))
        this.input = document.createElement('input')
        this.input.placeholder = 'what do you say'
        this.input.autofocus = true
        this.form = document.createElement('form')
        this.form.appendChild(this.input)
        this.form.onsubmit = this._handleSubmit.bind(this)
        this.form.setAttribute('prompt', location.pathname + ` → `)
        this.container.replaceChild(this.form, this.textArea)
        // A couple of ways to focus on the input. Click empty space, hit escape no matter what
        document.body.addEventListener('click', event => event.target === document.body && this.input.focus())
        document.body.addEventListener('keyup', event => event.key === 'Escape' && this.input.focus())
        delete this.textArea
    }

    _handleSubmit(event){
        event.preventDefault()                 // suppress default action of reloading the page
        var submit = this.input.value || '...' // push a symbol of silence, otherwise you'll get undefined from eval, this will reach chatbot for q gambit'
        this.input.value = ''                  //reset input to blank

        var messageBlock = new MessageBlock({input:  location.pathname + ` → ` + submit})
        var evalAttempt = this._evalledInWindow(submit)  // try to eval submit in window first
        messageBlock.output = evalAttempt             // add the result of evalling to the DOM whether it succeeded or not
        if(evalAttempt.localError){                              // and if that doesn't work, ask the server if it knows what to do with this string (submit)
            fetch(location.pathname + encodeURI('?echo ' + submit + ' | node interpret'), { method: 'POST' })
            .then(response => response.body ? response.body.getReader() : response.text().then( text => messageBlock._consumeText(text)))
            .then(reader => messageBlock._consumeStream(reader, messageBlock))
            // .then(()=> this.form.scrollIntoView())
        }
        this.next.appendChild(messageBlock.container)
        this.form.setAttribute('prompt', location.pathname + ` → `)
        this.form.scrollIntoView() // maybe the messages can grab their parent conversation to set scrollIntoView
    }

    _evalledInWindow(stringToEval){
        if(stringToEval.indexOf('cd') == 0){
            newDir = stringToEval.slice(3).trim()

            if(newDir == '.') return {successEval: 'OK'}
            if(newDir == '..'){
                var newPath = location.pathname.split('/')
                newPath.pop()
                newPath.pop()
                newPath = newPath.join('/') + '/' 
                location.pathname = newPath
                return {successEval: 'OK'}
                //new url is the rest of the string after you slice off the first slash and slice after the second slash
            }
            if(newDir == '~'){
                location.pathname = '' 
                return {successEval: 'OK'}
            }
            if(/[^\\/]/.test(newDir)){
                //if the last character is a black slash or forwardslash, and the first character is not,
                //append the new path to the pathname
                location.pathname += /\\\/\$/.test(newDir) ? newDir : newDir + '/'
                return {successEval: 'OK'}
            } else if (/^[\\/]/.test(newDir)){
                //if the first character is a slash
                location.pathname = /\\\/\$/.test(newDir) ? newDir : newDir + '/'
                return {successEval: 'OK'}
            }
        }
        if(stringToEval.trim() == 'clear'){
            Array.from(document.querySelectorAll('.messageBlock'), node => node.remove())
            return {successEval: 'OK'}
            form.setAttribute('prompt', location.pathname + ` → `)
        }
        // if it wasn't cd or clear, then eval it as a string
        try {
            var success = eval(stringToEval)
            return {successEval: success || String(success)} //coerce falsey values to string
        } catch(localError) {
            return {localError: localError.toString()} //errors are objects but can't be parsed by JSON stringify
        }
    }
    // delete this.textArea
}

class MessageBlock extends Block {
    constructor(options){
        super(Object.assign({
            class: "messageBlock",
            title: options.input,
            style: {
                width: "100%",
                height: "1.1em"
            },
        },options))
        this.textArea.setAttribute('disabled',true)
    }

    set output(data){
        Object.keys(data).forEach(key => {
            var oldData = this.container.getAttribute(key)
            var newData =  oldData ? oldData + data[key] : data[key]
            this.container.setAttribute(key, newData)
        })
        var mostSuccessful = result => result.bashdata || result.successfulchat || result.successeval || result.successbash
        this.textContent = mostSuccessful(this.attributes)
        /* basically 'set immediate' - calculate height after event loop becomes empty*/
        setTimeout(()=>{
            this.textArea.style.height = this.textArea.scrollHeight + 1
            /* I don't want to do it like this */
            document.querySelector('input').scrollIntoView()
        })
    }

    _consumeText(text){
        text.split(/\n(?={)/g).forEach(JSONchunk => this.output = JSON.parse(JSONchunk))
    }

    _consumeStream(reader){
        if(!reader) return null
        this.streambuffer || (this.streambuffer = '') //if streambuffer is undefined, create it
        return reader.read().then(sample => {
            if(sample.value){
                this.streambuffer += textDecoder.decode(sample.value)
                // if the last character of a chunk of data is a closing bracket, parse the JSON. Otherwise, keep consuming stream until it hits a closing bracket.
                // this leaves the very unfortunate possible bug of a chunk of data coming in with an escaped bracket at the end, and to detect this condition we'd have to pay attention to opening and closing quotes, except for escaped qutoes
                if(this.streambuffer.match(/}\s*$/)){
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => this.output = JSON.parse(JSONchunk))
                    delete this.streambuffer
                }
                return this._consumeStream(reader)
            }
        })
    }
}