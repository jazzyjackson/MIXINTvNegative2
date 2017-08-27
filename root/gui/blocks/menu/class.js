class MenuBlock extends HTMLElement {
    constructor(){
        super()
    }

    connectedCallback(){
        this.attachListeners()
        let menuList = document.createElement('ul')
        /* menu list is positioned absolutely against the right side */
        console.log('parent element is', this.parentElement)
        console.log('parents actions are', this.parentElement.actionMenu)
        for(var optionName in this.parentElement.actionMenu){
            optionName = optionName.replace(/ /g,'\u202F') // replace space with non-breaking space
            optionName = optionName.replace(/-/g, '\u2011') /* \u2011 ‑ non breaking hyphen! neat! not like those normal hyphens - */
            let menuOption = document.createElement('li')
            menuOption.textContent = optionName
            menuList.appendChild(menuOption)
        }
        /* transition should occur between 0 height and height of UL, but going from auto to 0 doesn't animate, so I have to explicitely set the max height as the calculated height. */
        this.appendChild(menuList)
        menuList.style.height = menuList.getClientRects()[0].height /* what? oh, I'm binding the calculated height of the whole menu to the ul, because I want to hide it by setting height to 0, and I want it to be an animated transition, and that's done automatically if I can set explicit changes in numbers. Transition doesn't happen going from 0 to auto. */
        this.parentElement.setAttribute('menu','hidden')
        this.waitForParentInit().then(()=>{
            console.log("My parent was initialized")
            menuList.style.top = this.parentElement.head.getClientRects()[0].height            
        })

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