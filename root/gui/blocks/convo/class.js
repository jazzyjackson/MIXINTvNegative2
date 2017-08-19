class ConvoBlock extends ReadBlock {
    constructor(options){
        super(options)
    }

    connectedCallback(){
        this.init()
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
        this.autoSubmit(this.getAttribute('init'))
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
}

customElements.define('message-block', MessageBlock)
customElements.define('convo-block', ConvoBlock)