class MessageBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
    }

    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['image','eval','goodchat','bashdata','goodeval','input']
    }

    attributeChangedCallback(attr, oldValue, newValue){
        console.log(attr)
        console.log(newValue)
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
            case 'bashdata':
                this.body.textContent = newValue
                break
            case 'goodchat':
                this.body.textContent = newValue
                break;
            case 'goodeval':
                this.body.textContent = newValue
                break;
            default:
                console.log(arguments)
        }
        setTimeout(() => this.body.scrollIntoView(), 0) // aka setImmediate, scroll when event loop empties
    }

    appendImage(imageURL){
        var image = document.createElement('img')
        image.setAttribute('src', imageURL)
        this.body.appendChild(image)
    }
}