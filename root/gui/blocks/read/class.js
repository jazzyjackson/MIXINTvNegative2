/* to allow for progressive loading of partial response via Chrome body.getReader(),
* but if I'm inside a browser without the body property, 
* just wait til response is over and return the entire text response */
const textDecoder = TextDecoder ? new TextDecoder('utf8') : undefined

class ReadBlock extends ProtoBlock {
    constructor(options){
        super()
        this.options = options
    }

    static get actions(){
        return {
            "re-request": {
                func: this.prototype.request,
                args: [{input: "filename"}, {select: ["GET","POST","DELETE","PUT"]}],
            }
            /* get from disk */
            /* put to disk */
            /* delete from disk request(this.path + this.name, {method: "DELETE"}*/
        } 
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

    connectedCallback(){
        this.init() // doesn't really do anything on ReadBlock as a base class right after HTMLElement, but stuck here just for consistency, if you're using this as a model for what you should do */
        /* if action & method are defined, set the props of this node by fetching. skip if concenttype is already truthy, fetch already happened */
        this.props.action && this.props.method 
                          && !this.contenttype 
                          && this.request()
    }

    request(action, method){
        console.log("ACTION", action)
        console.log("method", method)
        action && method 
               && this.clear() 
               && Object.assign(this.props, {action, method}) // if request was called with arguments, clear all attributes and assign action and method, make the call again.
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
}

customElements.define('read-block', ReadBlock)