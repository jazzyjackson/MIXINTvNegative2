class CodemirrorBlock extends TextBlock {
  constructor(options){
      super(options)
  }

  static get actions(){
    return {
      "code mode": {
          func: this.prototype.codeMode,
          info: "Set syntax highlighting",
          args: [{select: ["javascript","css","htmlmixed"]}]
      }
    }
  }

  codeMode(newMode){
    this.cm.setOption('mode', newMode)
  }

  connectedCallback(){
      this.init()
  }
  static get observedAttributes() {
      /* chatbot can send back 'Out of Band' data which will be attached as attributes to this block */
      /* attributeChangedCallback can attach special behavior to the block when these properties are set */
      return ['text']
  }

  attributeChangedCallback(attr, oldValue, newValue){
      switch(attr){
          case 'text': 
              this.textarea.textContent = newValue
              this.cm = CodeMirror.fromTextArea(this.textarea, {lineNumbers: true, mode: 'javascript'})
              break
          default:
              console.error("DEFAULT", newValue)
      }
  }

}
customElements.define('codemirror-block', CodemirrorBlock)
