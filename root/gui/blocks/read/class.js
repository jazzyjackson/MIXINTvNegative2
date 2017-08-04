/* to allow for progressive loading of partial response via Chrome body.getReader(),
* but if I'm inside a browser without the body property, 
* just wait til response is over and return the entire text response */
const textDecoder = TextDecoder ? new TextDecoder('utf8') : undefined

class ReadBlock extends HTMLElement {
    constructor(options){
        super()
        Object.assign(this, options)
        this.appendChild(document.querySelector(`[renders="${this.template || 'read-block'}"]`).content.cloneNode(true))  
        this.head = this.querySelector('b-head')
        this.next = this.querySelector('b-next')
        this.body = this.querySelector('b-body')
        this.id = 'block' + String(Math.random()).slice(-4) + String(Date.now()).slice(-4) //random id for convenience. random number + time to reduce likelihood of collisions
    }
    
    connectedCallback(){
        var {action, method} = this
        /* if this element is programmatically created, set action and method, 
         * if action and method were declared in markup, fine, get 'em */
        action ? this.setAttribute('action', action)
               : action = this.getAttribute('action')
        method ? this.setAttribute('method', method)
               : method = this.getAttribute('method')

        /* if action & method are defined, set the textContent of this node by fetching */
        action && method && fetch(action, { method, credentials: "same-origin" })
        .then(response => response.body ? response.body.getReader() 
                                        : response.text().then(text => this.consumeText(text)))
        .then(reader => this.consumeStream(reader))
    }

    set output(data){
        // for the basic ReadBlock, maybe you get a string back, maybe an object.
        this.body.textContent += typeof data == 'object' ? JSON.stringify(data) : data
    }

    consumeText(text){
        text.split(/\n(?={)/g).forEach(JSONchunk => this.output = JSON.parse(JSONchunk))
    }

    consumeStream(reader, contentType = 'application/json'){
        if(!reader) return null  // consumeStream will exit if the text was consumed already
        this.streambuffer || (this.streambuffer = '') //if streambuffer is undefined, create it
        /* recursively call consumeStream. reader.read() is a promise that resolves as soon as a chunk of data is available */
        return reader.read().then(sample => {
            if(sample.value){
                this.streambuffer += textDecoder.decode(sample.value)
                // if the last character of a chunk of data is a closing bracket, parse the JSON. Otherwise, keep consuming stream until it hits a closing bracket.
                // this leaves the very unfortunate possible bug of a chunk of data coming in with an escaped bracket at the end, and to detect this condition we'd have to pay attention to opening and closing quotes, except for escaped qutoes
                if(contentType == 'application/json' && this.streambuffer.match(/}\s*$/)){
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => this.output = JSON.parse(JSONchunk))
                    delete this.streambuffer
                } else if(contentType == 'plain/text'){
                    this.output = this.streambuffer
                    delete this.streambuffer
                }
                return this.consumeStream(reader)
            }
        })
    }

}

customElements.define('read-block', ReadBlock)
