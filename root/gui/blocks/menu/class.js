class MenuBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        var parentBlock = this.parentElement
        parentBlock.addEventListener('keydown', event => {
            if(event.key == 'Enter'){
                console.log(parentBlock.getAttribute('menu'))
                parentBlock.getAttribute('menu') ? parentBlock.removeAttribute('menu')
                                                 : parentBlock.setAttribute('menu','visible')
                /* toggle menu attribute */

            }
        })
        this.addEventListener('click', () => {
                console.log(!parentBlock.getAttribute('menu'))
                parentBlock.setAttribute('menu', !parentBlock.getAttribute('menu'))            
        })
        parentBlock.addEventListener('blur', () => {
            parentBlock.removeAttribute('menu')
        })
    }
}

customElements.define('menu-block', MenuBlock)