// class BlockHead extends HTMLElement {
//     constructor(){
//         super()
//     }
// }

class BasicBlock extends HTMLElement {
    constructor({template} = {}){
        super()
        /* I could have used a ShadowRoot, which web components can do lots of cool things with,
         * but I want to seamlessly traverse the graph of nodes by stepping through next
         * ShadowRoot lets you do this with mode: open, but I think it's an extra step. could be wrong */
        console.log(template)
        console.log(document.getElementById(template || 'basic-template'))
        this.appendChild(document.getElementById(template || 'basic-template').content.cloneNode(true))
        console.log(this)
        this.head = this.querySelector('b-head')
        this.next = this.querySelector('b-next')
        this.body = this.querySelector('b-body')
        console.log(this)
        this.id = 'block' + String(Math.random()).slice(-5) //random id for convenience. yea yea possible collisions.
    }
}   

const textDecoder = new TextDecoder('utf8')

class ResponseBlock extends BasicBlock {
    constructor({action, method} = {}){
        super()
        if(!action || !method) throw new Error("I need an action and method to construct a response block")
        /* if this element is programmatically created, set action and method, 
         * if action and method were declared in markup, fine, get 'em */
        action ? this.setAttribute('action', action)
               : action = this.getAttribute('action')
        method ? this.setAttribute('method', method)
               : method = this.getAttribute('method')

        /* to allow for progressive loading of partial response via Chrome body.getReader(),
         * but if I'm inside a browser without the body property, 
         * just wait til response is over and return the entire text response */
        action && method && fetch(action, { method, credentials: "same-origin" })
        .then(response => response.body ? response.body.getReader() 
                                        : response.text().then(text => this.consumeText(text)))
        .then(reader => this.consumeStream(reader))

    }

    set output(data){
        // for the basic ResponseBlock, maybe you get a string back, maybe 
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
                if(contentType = 'application/json' && this.streambuffer.match(/}\s*$/)){
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => this.output = JSON.parse(JSONchunk))
                    delete this.streambuffer
                } else if(contentType = 'plain/text'){
                    this.output = this.streambuffer
                    delete this.streambuffer
                }
                return this.consumeStream(reader)
            }
        })
    }

}

customElements.define('basic-block', BasicBlock)
customElements.define('response-block', ResponseBlock)
// customElements.define('b-head', BlockHead)