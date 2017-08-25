class MenuBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        var parentBlock = this.parentElement
        parentBlock.addEventListener('keydown', event => {   
            if(event.target != parentBlock) return null // don't react of event bubbled through this node, also 'this' is still MenuBlock
            if(event.key == 'Enter'){
                var currently = parentBlock.getAttribute('menu') 
                parentBlock.setAttribute('menu', currently == 'visible' ? 'hidden' : 'visible')
                /* toggle menu attribute */
            } else if (event.key == 'Escape'){
                parentBlock.setAttribute('menu', 'hidden')            
            }
        })
        this.addEventListener('click', () => {
            var currently = parentBlock.getAttribute('menu')
            parentBlock.setAttribute('menu', currently == 'visible' ? 'hidden' : 'visible')            
        })
        parentBlock.addEventListener('blur', () => {
            parentBlock.removeAttribute('menu')
        })
    }
}
document.addEventListener('click', event => console.log(event.target.tagName))
customElements.define('menu-block', MenuBlock)