class TextBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(options)
    }

    connectedCallback(){
        this.init()
        this.head.textContent = this.getAttribute('action')
        this.style.top || (this.style.top = '50px')
        this.style.left || (this.style.left = '50px')
        this.tabIndex = 1
        this.head.addEventListener('mousedown', handleDrag)
    }    

    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['text']
    }

    attributeChangedCallback(attr, oldValue, newValue){
        switch(attr){
            case 'text': 
                this.body.firstElementChild.textContent = newValue
                break
            default:
                console.log("DEFAULT", newValue)
        }
    }
}
customElements.define('text-block', TextBlock)
