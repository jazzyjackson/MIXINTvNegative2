class MessageBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
        this.head.textContent = options.input
        this.setAttribute('headless', options.headless)
    }

    set output(data){
        if(this.head.textContent[0] == ':' && this.head.textContent.indexOf(':reset') != 0){
            var pre = document.createElement('pre')
            pre.textContent = data.goodchat
            this.body.appendChild(pre)
        } else {
            this.body.innerHTML = data.goodchat
        }
        
        Object.keys(data).forEach(key => {
            if(key == 'eval') eval(data[key])
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

    appendImage(imageURL){
        var image = document.createElement('img')
        image.setAttribute('src', imageURL)
        this.body.appendChild(image)
    }
}