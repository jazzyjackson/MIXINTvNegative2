class MarkdownBlock extends TextBlock {
    constructor(options){
        super(options)
    }

    connectedCallback(){
        this.init()
        this.converter = new showdown.Converter
    }
    static get observedAttributes() {
        /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
        /* attributeChangedCallback can attach special behavior to the block when these properties are set */
        return ['text']
    }

    attributeChangedCallback(attr, oldValue, newValue){
        switch(attr){
            case 'text': 
                this.body.innerHTML = this.converter.makeHtml(newValue)
                break
            default:
                console.error("DEFAULT", newValue)
        }
    }

}
customElements.define('markdown-block', MarkdownBlock)
