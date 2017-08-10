/* to allow for progressive loading of partial response via Chrome body.getReader(),
* but if I'm inside a browser without the body property, 
* just wait til response is over and return the entire text response */
const textDecoder = TextDecoder ? new TextDecoder('utf8') : undefined

class ReadBlock extends HTMLElement {
    constructor(options){
        super()
        /* querySelector is given a css selector looking for a renders attribute with a value passed via options or a default value of read-block */
        /* this template is then cloned (deep=true to pull in children of template) and appended as the child inside this node */
        this.appendChild(document.querySelector(`[renders="${options.template || 'read-block'}"]`).content.cloneNode(true))  
        this.head = this.querySelector('b-head') /* Had a lot of back and forth to organize the graph with each node having a next property */
        this.next = this.querySelector('b-next') /* I thought it might be a lot more elegant to have each custom element have its own shadowroot, So that the topmost lightDOM would just be a graph of custom elements. */
        this.body = this.querySelector('b-body') /* But ShadowRoots introduce a lot of repition, loading the whole stylesheet per node, and for customization reasons I actually don't want to encapsulate style */
        this.id = 'block' + String(Math.random()).slice(-4) + String(Date.now()).slice(-4) //random id for convenience. random number + time to reduce likelihood of collisions
        this.props = options
    }

    set props(data){
        if(typeof data != 'object'){ // convert strings and numbers into the property data, containing the value of data, so it can be appended to and reacted to normally
            data = {data}
        }
        Object.keys(data).forEach(key => {
            var oldData = this.getAttribute(key)
            var newData =  oldData ? oldData + data[key] : data[key]
            this.setAttribute(key, newData)
        })
    }
    
    connectedCallback(){
        var action = this.getAttribute('action')
        var method = this.getAttribute('method')
        /* if action & method are defined, set the props of this node by fetching */
        action && method && fetch(action, { method, credentials: "same-origin" })
        .then(response => response.body ? response.body.getReader() 
                                        : response.text().then(text => this.consumeText(text)))
        .then(reader => this.consumeStream(reader))
    }

    consumeText(text){
        text.split(/\n(?={)/g).forEach(JSONchunk => this.props = JSON.parse(JSONchunk))
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
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => this.props = JSON.parse(JSONchunk))
                    delete this.streambuffer
                } else if(contentType == 'plain/text'){
                    this.props = this.streambuffer
                    delete this.streambuffer
                }
                return this.consumeStream(reader)
            }
        })
    }

}

customElements.define('read-block', ReadBlock)
