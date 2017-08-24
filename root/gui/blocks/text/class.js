class TextBlock extends ReadBlock {
    /* options = {action, method, input, headless} */
    constructor(options){ 
        super(Object.assign({
            style: "top: 50px; left: 50px;",
            tabIndex: 0
        }, options))
    }

    connectedCallback(){
        this.init()
        this.head.textContent = this.getAttribute('action')
        this.head.addEventListener('mousedown', handleDrag)
        this.textarea = this.body.firstElementChild
        this.textarea.onfocus = this.focus.bind(this)
        this.textarea.onblur = this.blur.bind(this)
        this.onfocus = this.focus.bind(this)
        this.onblur = this.blur.bind(this)
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
                console.error("DEFAULT", newValue)
        }
    }

    focus(){
        this.blur()
        this.classList.add('focused')
    }

    blur(){
        Array.from(document.getElementsByClassName('focused'), node => node.classList.remove('focused'))
    }
}
customElements.define('text-block', TextBlock)

function focus(){
    //can be called to remove focused style from all nodes and apply className focused to a node, or called with no argument to just unfocus all
    Array.from(document.getElementsByClassName('focused'), node => node.classList.remove('focused'))
    this && this.classList.add('focused')
}