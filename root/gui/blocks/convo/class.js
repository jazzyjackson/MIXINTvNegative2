/* interesting. PartyBlock could extend ConvoBlock or ShellBlock, depending on if you want localEval and changeDirectory to be a thing */
class ConvoBlock extends ProtoBlock {
    constructor(options){
        super(options)
    }

    static get actions(){
        return {
            "clear convo": {
                func: this.prototype.clearConvo,
                info: "the equivelant of typing 'clear' into the shell, simply deletes existing message blocks from this interface. Note this does not touch any files on disk"
            },
            "convo mode": {
                func: this.prototype.switchMode,
                args: [{select: ["self","party"]}]
            }
        }
    }

    connectedCallback(){    
        this.init()
        this.head.textContent = location.host
        this.form = this.body.firstElementChild
        this.input = this.form.firstElementChild
        this.form.onsubmit = this.handleSubmit.bind(this)
        window.autoSubmit = this.autoSubmit.bind(this)

        if(this.props.convomode == 'party'){
            this.addEventListener('init', () => {
                this.startMultiPlayer()
            })
        }

        // A couple of ways to focus on the input. Click empty space, hit escape no matter what
        document.documentElement.addEventListener('click', event => event.target === document.body 
                                                                 || event.target === document.documentElement
                                                                 || event.target === this
                                                                 && this.input.focus())
        document.body.addEventListener('keyup', event => event.key === 'Escape' && this.input.focus())
        this.autoSubmit(this.getAttribute('init'))
    }

    switchMode(newMode){
        this.setAttribute('convomode', newMode)
        this.become() // aka 'become self', or re-initialize with new attribute set
    }

    /* changing convo modes will reload this component. become itself but with new attributes - set convoMode as multiplayer */
    startMultiPlayer(){
        // set attribute convoPartner: party, or group name whatever.
        // oh yeah I still want locally evallable js to eval on everyone's machine cuz its hilarious and strange
        // allow convo partner to eval code in this window - just an options
        // the fetch to tail should be recursively promise itself - I expect each new tail response should be 512 bytes max, so never split up across blobs
        fetch('tail -f .convolog', { method: 'POST', credentials: "same-origin", redirect: "error" })
        .then(response => response.body.getReader())
        .then(reader => {
            /* might handle the strage use case of tailing a file and searching for the first newline char and parsing from there */
            if(!reader) return null  // consumeStream will exit if the text was consumed already
            this.streambuffer || (this.streambuffer = '') //if streambuffer is undefined, create it
            /* recursively call consumeStream. reader.read() is a promise that resolves as soon as a chunk of data is available */
            return reader.read().then(sample => {
                if(sample.value){
                    this.streambuffer += textDecoder.decode(sample.value)
                    if(this.streambuffer.match(/}\s*$/)){
                        this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => {
                            // append a new message with the properties 
                            var newMessage = document.createElement('message-block')
                            newMessage.props = JSON.parse(JSONchunk)
                            this.next.appendChild(newMessage)
                        })
                        delete this.streambuffer
                    }
                    return this.consumeStream(reader)
                }
            })
        })
        .catch(err => {
            console.error(err)
            console.error('multiplayer convo requires responseStream API, available in chrome')
        })


    }

    handleSubmit(event, options = {headless: false}){
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener
        var newMessage = document.createElement('message-block')
        newMessage.props = {
            action: '/?' + encodeURI(this.input.value || '...'),
            method: 'POST',
            input: this.input.value || '...',
            headless: options.headless
        }
        this.next.appendChild(newMessage)
        this.input.value = '' // reset input to blank (if there's not a keepInput prop on options)
    }

    /* programmatically submit input for chatbot to response to. defaults to headless, ie, don't show the input */
    autoSubmit(string2submit, options = {headless: true}){
        var oldstring = this.input.value
        this.input.value = string2submit
        this.handleSubmit(null, options)
        this.input.value = oldstring
    }

    clearConvo(){
        while (this.next.hasChildNodes()){
            this.next.removeChild(this.next.lastChild) 
        }
    }
}
customElements.define('convo-block', ConvoBlock)