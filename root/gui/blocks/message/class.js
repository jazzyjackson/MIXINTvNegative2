class MessageBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
        this.head.textContent = options.input
        this.setAttribute('headless', options.headless)
    }

    set output(data){
        // if(this.head.textContent[0] == ':' && this.head.textContent.indexOf(':reset') != 0){
        //     var pre = document.createElement('pre')
        //     pre.textContent = data.goodchat
        //     this.body.appendChild(pre)
        // } else {
        //     this.body.innerHTML = data.goodchat
        // }
        Object.keys(data).forEach(key => {
            var oldData = this.getAttribute(key)
            var newData =  oldData ? oldData + data[key] : data[key]
            this.setAttribute(key, newData)
        })
    }

    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['image','eval','goodchat','bashdata','goodeval']
    }

    attributeChangedCallback(attr, oldValue, newValue){
        switch(attr){
            case 'image': 
                this.appendImage('/gui/static/img/' + newValue)
                break
            case 'eval':
                /* eval properties returned from ChatScript will be executed in the browser's global scope. Console log the result. */            
                console.log('evalling command from ChatScript:', eval(newValue))
                break
            case 'bashdata':
                this.updatePreFormattedText(newValue)
                break
            case 'goodchat':
                this.updatePreFormattedText(newValue)
                break;
            case 'goodeval':
                this.updatePreFormattedText(newValue)
                break;
            default:
                console.log(arguments)
        }
        setTimeout(() => this.body.scrollIntoView()) // aka setImmediate, scroll when event loop empties
    }

    updatePreFormattedText(newText){
        var oldPreText = this.body.querySelector('pre')        
        if( oldPreText ){
            oldPreText.textContent = newText
        } else {
            var data = document.createElement('pre')
            data.textContent = newText
            this.body.appendChild(data)
        }
    }

    appendImage(imageURL){
        var image = document.createElement('img')
        image.setAttribute('src', imageURL)
        this.body.appendChild(image)
    }
}