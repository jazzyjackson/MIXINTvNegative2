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

    static get superClassChain(){
        var superClassChain = []
        var superclass = this /* this is the part thats different for the class method: we can call the prototype of the class */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }
        return superClassChain 
    }

    get superClassChain(){
        var superClassChain = []
        var superclass = this.constructor /* this is the part thats different for the instance method: we have to call the constructor before we call for the prototype */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }
        return superClassChain
    }
    
    init(){
        /* this calls every connectedCallback up the class inheritence chain or whatever you want to call it */
        if(this.initialized) return null
        else this.initialized = true
        /* call in reverse order to invoke base class connectedCallback first. */
        this.superClassChain.reverse().forEach(superClass => superClass.prototype.connectedCallback.call(this))
        console.log("Dispatching LOAD from", this.tagName)
        this.dispatchEvent(new Event('load')) /* fire load event so other elements can wait for the node to be initialized */

    }

    request(action, method){
        action && method && this.clear() && Object.assign(this.props, {action, method}) // if request was called with arguments, clear all attributes and assign action and method, make the call again.
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
        if(!data){
            return this.props
        }
        if(typeof data != 'object'){ // convert strings and numbers into the property data, containing the value of data, so it can be appended to and reacted to normally
            data = {data}
        }
        Object.keys(data).forEach(key => {
            let oldData = this.getAttribute(key)
            let newData =  oldData ? oldData + data[key] : data[key]
            this.setAttribute(key, newData)
        })
        return this.props
    }

    clear(){
        /* a method for destroying attributes, to reset the block, but there's probably some attributes you want to keep. tabIndex and style needs to exist for click and drag (active element works off focus, updates from style attributes) */
        let keepAttributes = ['id','style','tabIndex']
        return Array.from(this.attributes, attr => keepAttributes.includes(attr.name) || this.removeAttribute(attr.name))
    }

    get props(){
        /* an ugly way to coerce a NamedNodeMap (attributes) into a normal key: value object. 
        Use ES6 enhanced object literals to eval node.name as a key, so you have an array of objects (instead of attribute) and then you can just roll it up with reduce */
        return Array.from(this.attributes, attr => ({[attr.name]: attr.value}))
                    .reduce((a, b) => Object.assign(a, b)) // You would think you could do .reduce(Object.assign), but assign is variadic, and reduce passes the original array as the 4th argument to its callback, so you would get the original numeric keys in your result if you passed all 4 arguments of reduce to Object.assign. So, explicitely pass just 2 arguments, accumulator and next.
    }

    static from(url, options = {method: 'get'}){
        var newBlock = new this
        if(url){
            newBlock.props = {
                action: encodeURI(url), 
                method: options.method, 
                title: location.pathname + url
            }
        }
        var parentNode = options.parentNode || document.body
        parentNode.appendChild(newBlock)
        return newBlock
    }
    // each class will have a static menu getter that returns the locally defined functioned to expose to the menu function. No need to bind, the function referenced will be invoked with 'call(parentBlock, args)'
    // if a menu includes a method of the same name, probably want to use the lower one in the class heirarchy
    static get menu(){
        return {
            /* \u2011 ‑ non breaking hyphen! neat! not like those normal hyphens - */
            "re‑request": {
                func: this.prototype.request,
                args: [{action: String}, {method: String}],
                defaults: [undefined, 'URL']
            },
            "become": {
                func: this.prototype.become,
                args: [{enum: Array.from(document.querySelectorAll('template'), template => template.getAttribute('renders'))}]
            }
        } 
    }   

}

customElements.define('read-block', ReadBlock)