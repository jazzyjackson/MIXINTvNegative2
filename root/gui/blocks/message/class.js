class MessageBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
    }

    connectedCallback(){
        this.init()
    }    

    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['image','eval','goodchat','bashdata','goodeval','evaldata','input','text']
    }

    attributeChangedCallback(attr, oldValue, newValue){
        switch(attr){
            case 'input':      
                this.head.textContent = newValue
                break
            case 'image': 
                this.appendImage('/gui/static/img/' + newValue)
                break
            case 'eval':
                /* eval properties returned from ChatScript will be executed in the messages's local scope. Console log the result. */            
                console.log('evalling command from ChatScript:', eval(newValue))
                break
            default:
                this.body.textContent = newValue
        }
        document.querySelector('message-block:last-child').scrollIntoView()
    }
}