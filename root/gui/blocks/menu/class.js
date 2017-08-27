class MenuBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        this.attachListeners()
        let menuList = document.createElement('ul')
        /* menu list is positioned absolutely against the right side */
        for(var optionName in this.menuOptions){
            let menuOption = document.createElement('li')
            menuOption.textContent = optionName
            menuList.appendChild(menuOption)
        }
        /* transition should occur between 0 height and height of UL, but going from auto to 0 doesn't animate, so I have to explicitely set the max height as the calculated height. */
        this.appendChild(menuList)
        menuList.style.height = menuList.getClientRects()[0].height /* what? oh, I'm binding the calculated height of the whole menu to the ul, because I want to hide it by setting height to 0, and I want it to be an animated transition, and that's done automatically if I can set explicit changes in numbers. Transition doesn't happen going from 0 to auto. */
        this.parentElement.setAttribute('menu','hidden')
        /* damn I wish there was a better way to do this, but when HTML is parsed from file, 
        the parentBlock gets connected before the menuBlock - when HTML is cloned from template, 
        the menublock is connected before the parentblock, so .head.getClientRects is unavailable. 
        I just have to handle both cases unless I think of something better */
        if(this.parentElement.head){
            console.log(this.parentElement.head.outerHTML)
            menuList.style.top = this.parentElement.head.getClientRects()[0].height            
        } else {
            /* custom 'load' event is dispatched via read-block's connectedCallback */
            this.parentElement.addEventListener('load', () => {
                menuList.style.top = this.parentElement.head.getClientRects()[0].height
            })
        }

    }

    get menuOptions(){
        /* this getter walks up the prototype chain, invoking 'get menu' on each class, then with that array of menu objects, reduce Object assign is called to return an amalgamated object of menu options */
        return this.parentElement.superClassChain.map(superclass => superclass.menu).reduce((a,b) => Object.assign(a,b))
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