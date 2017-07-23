
class MessageBlock extends ResponseBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
        this.head.textContent = options.input
        this.setAttribute('headless', options.headless)
    }

    set output(data){
        this.body.innerHTML = data.goodchat
        Object.keys(data).forEach(key => {
            if(key == 'eval') eval(data[key]) //if the bot tells us to eval, go and eval it.
            // set attributes from incoming data from this fetch, if property values are repeated, append the new value to the old one
            var oldData = this.getAttribute(key)
            var newData =  oldData ? oldData + data[key] : data[key]
            this.setAttribute(key, newData)
        })
    }

    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['image','eval','goodchat']
    }

    appendImage(imageURL){
        var image = document.createElement('img')
        image.setAttribute('src', imageURL)
        this.body.appendChild(image)
    }

    /* afterOutputUpdate can be overwritten by deriviative classes, still get called by prototypal output setter */
    attributeChangedCallback(attr, oldValue, newValue){
        switch(attr){
            case 'image': 
                this.appendImage('/gui/static/img/' + newValue)
                break
            case 'eval':
                console.log(eval(newValue))
                break
            default:
                console.log(arguments)
        }
        setTimeout(() => this.body.scrollIntoView()) // aka setImmediate, scroll when event loop empties
    }
}

class ConvoBlock extends BasicBlock {
    constructor(){
        super({template: 'convo-template'})
        this.head.textContent = location.host
        this.input = this.body.querySelector('input')
        this.form = this.body.querySelector('form')
        this.form.onsubmit = this.handleSubmit.bind(this)
        window.autoSubmit = this.autoSubmit.bind(this)

        // A couple of ways to focus on the input. Click empty space, hit escape no matter what
        document.documentElement.addEventListener('click', event => event.target === document.body 
                                                                 || event.target === document.documentElement
                                                                 || event.target === this
                                                                 && this.input.focus())
        document.body.addEventListener('keyup', event => event.key === 'Escape' && this.input.focus())
        this.autoSubmit(':reset')
    }

    handleSubmit(event, options = {headless: false}){
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener
        this.next.appendChild(new MessageBlock({
            action: '/?' + encodeURI(this.input.value || '...'),
            method: 'POST',
            input: this.input.value || '...',
            headless: options.headless
        }))
        this.input.value = '' // reset input to blank (if there's not a keepInput prop on options)
    }

    /* programmatically submit input for chatbot to response to. defaults to headless, ie, don't show the input */
    autoSubmit(string2submit, options = {headless: true}){
        var oldstring = this.input.value
        this.input.value = string2submit
        this.handleSubmit(null, options)
        this.input.value = oldstring
    }
}

customElements.define('message-block', MessageBlock)
customElements.define('convo-block', ConvoBlock)