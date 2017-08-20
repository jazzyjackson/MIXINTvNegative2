/* to allow for progressive loading of partial response via Chrome body.getReader(),
* but if I'm inside a browser without the body property, 
* just wait til response is over and return the entire text response */
const textDecoder = TextDecoder ? new TextDecoder('utf8') : undefined

class ReadBlock extends HTMLElement {
    constructor(options){
        super()
        this.options = options
    }

    connectedCallback(){
        this.init() // doesn't really do anything on ReadBlock as a base class right after HTMLElement, but stuck here just for consistency, if you're using this as a model for what you should do 
        this.innerHTML = ''
        this.appendChild(document.querySelector(`[renders="${this.tagName.toLowerCase()}"]`).content.cloneNode(true))  
        this.head = this.querySelector('b-head') /* Had a lot of back and forth to organize the graph with each node having a next property */
        this.next = this.querySelector('b-next') /* I thought it might be a lot more elegant to have each custom element have its own shadowroot, So that the topmost lightDOM would just be a graph of custom elements. */
        this.body = this.querySelector('b-body') /* But ShadowRoots introduce a lot of repition, loading the whole stylesheet per node, and for customization reasons I actually don't want to encapsulate style */
        this.id = 'block' + String(Math.random()).slice(-4) + String(Date.now()).slice(-4) //random id for convenience. random number + time to reduce likelihood of collisions
        this.props = this.options
        /* if action & method are defined, set the props of this node by fetching. skip if concenttype is already truthy, fetch already happened */
        this.props.action && this.props.method && !this.contenttype && this.request()    
    }
    
    init(){
        if(this.initialized) return null
        else this.initialized = true
        /* this calls every connectedCallback up the class inheritence chain or whatever you want to call it */
        /* call in reverse order to invoke base class connectedCallback first. */
        var superClassChain = []
        var superclass = this.constructor.__proto__
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.connectedCallback)
            superclass = superclass.__proto__
        }
        superClassChain.reverse().forEach(callback => callback.call(this))
    }

    request(){
        console.log(this.props.action)
        fetch(this.props.action, { method: this.props.method, credentials: "same-origin", redirect: "error" })
        .then(response => {this.props = {contenttype: response.headers.get('content-type')}; return response;})
        .then(response => response.body ? response.body.getReader() 
                                        : response.text().then(text => this.consumeText(text)))
        .then(reader => this.consumeStream(reader))
    }

    consumeText(text){
        if(this.props.contentType.includes('application/json')) {
            text.split(/\n(?={)/g).forEach(JSONchunk => this.props = JSON.parse(JSONchunk))
        } else {
            this.props = {text}
        }
    }

    consumeStream(reader, contentType = 'application/json'){
        var contentType = this.getAttribute('contenttype')
        if(!reader) return null  // consumeStream will exit if the text was consumed already
        this.streambuffer || (this.streambuffer = '') //if streambuffer is undefined, create it
        /* recursively call consumeStream. reader.read() is a promise that resolves as soon as a chunk of data is available */
        return reader.read().then(sample => {
            if(sample.value){
                this.streambuffer += textDecoder.decode(sample.value)
                // if the last character of a chunk of data is a closing bracket, parse the JSON. Otherwise, keep consuming stream until it hits a closing bracket.
                // this leaves the very unfortunate possible bug of a chunk of data coming in with an escaped bracket at the end, and to detect this condition we'd have to pay attention to opening and closing quotes, except for escaped qutoes
                if(contentType.includes('application/json') && this.streambuffer.match(/}\s*$/)){
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => this.props = JSON.parse(JSONchunk))
                    delete this.streambuffer
                } else if(contentType.includes('text/plain')){
                    this.props = {text: this.streambuffer}
                    delete this.streambuffer
                }
                return this.consumeStream(reader)
            }
        })
    }

    become(blockType){
        var newBlock = document.createElement(blockType)
        newBlock.props = this.props
        this.replaceWith(newBlock)
        return newBlock
    }

    set props(data){
        console.log(data)
        if(!data){
            return this.props
        }
        if(typeof data != 'object'){ // convert strings and numbers into the property data, containing the value of data, so it can be appended to and reacted to normally
            data = {data}
        }
        Object.keys(data).forEach(key => {
            var oldData = this.getAttribute(key)
            var newData =  oldData ? oldData + data[key] : data[key]
            this.setAttribute(key, newData)
        })
        return this.props
    }

    get props(){
        var temp = {}
        Array.from(this.attributes, attr => temp[attr.name] = attr.value)
        return temp
    }

    static from(url, options = {method: 'get'}){
        var newBlock = new this
        if(url){
            newBlock.props = {
                action: url, 
                method: options.method, 
                title: location.pathname + url
            }
        }
        var parentNode = options.parentNode || document.body
        parentNode.appendChild(newBlock)
        return newBlock
    }

}

customElements.define('read-block', ReadBlock)