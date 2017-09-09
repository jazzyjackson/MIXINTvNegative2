class MenuBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        this.attachListeners()
        let menuList = document.createElement('ul')
        let parentBlock = this.parentElement
        /* menu list is positioned absolutely against the right side */
        console.log('parent element is', this.parentElement)
        console.log('parents actions are', this.parentElement.actionMenu)
        for(let optionName in parentBlock.actionMenu){
            let menuOption = document.createElement('li')
            menuOption.textContent = optionName.replace(/ /g,'\u202F').replace(/-/g, '\u2011') /* replace spaces and hyphens with their unicode non-breaking variants to prevent word-wrapping in menu */
            menuOption.addEventListener('click', this.actionCreator(menuOption,parentBlock.actionMenu[optionName],parentBlock))
            menuList.appendChild(menuOption)
        }
        this.appendChild(menuList)
        /* transition should occur between 0 height and height of UL, but going from auto to 0 doesn't animate, so I have to explicitely set the max height as the calculated height. */
        menuList.style.height = menuList.getClientRects()[0].height
        this.parentElement.setAttribute('menu','hidden')
        this.waitForParentInit().then(()=>{
            menuList.style.top = this.parentElement.head.getClientRects()[0].height            
        })
    }

    actionCreator(menuOption, optionObject, context){
        optionObject.args 
        /* might be undefined, in that case, just invoke the function, no args */
        /* otherwise, it should be an array of objects, whose key is the type of input. Text, Number, Select, 
        /* following keyname is either the default option or the content of the select form... */
        return function(){
            /* modifies the menuOption, adds an event listener to execute after collecting options */
            var args = prompt('what should I pass to ' + optionObject.func.name)
            optionObject.func.call(context, args)
        }
       
    }

    waitForParentInit(){
        return new Promise( resolve => {
            if(this.parentElement.initialized){
                resolve()
            } else {
                this.parentElement.addEventListener('init', resolve)
            }
        })
    }

    attachListeners(){
        this.parentElement.addEventListener('keydown', event => {   
            if(event.target != this.parentElement) return null // don't react of event bubbled through this node, also 'this' is still MenuBlock
            if(event.key == 'Enter'){
                var currently = this.parentElement.getAttribute('menu') 
                this.parentElement.setAttribute('menu', currently == 'visible' ? 'hidden' : 'visible')
                /* toggle menu attribute */
            } else if (event.key == 'Escape'){
                this.parentElement.setAttribute('menu', 'hidden')            
            }
        })
        this.addEventListener('click', () => {
            var currently = this.parentElement.getAttribute('menu')
            this.parentElement.setAttribute('menu', currently == 'visible' ? 'hidden' : 'visible')            
        })
        this.parentElement.addEventListener('blur', () => {
            this.parentElement.setAttribute('menu', 'hidden')
        })
    }
}
document.addEventListener('click', event => console.log(event.target.tagName))
customElements.define('menu-block', MenuBlock)