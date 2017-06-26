class BlockMenu {
    constructor(nodeToMenufy){
        var blockType = nodeToMenufy.getAttribute('type')            
        var blockConstructor = window.constructors[blockType]            
        var blockMethodNames = Object.getOwnPropertyNames(blockConstructor.prototype)
        var blockMethodDescriptors = Object.getOwnPropertyDescriptors(blockConstructor.prototype)
        var menuMethods = blockMethodNames.filter(name => {
            // inspect the Object Property Descriptor to determine whether this is a method or a getter/setter
            // also filter out the constructor function, its not useful on the menu
            return !(blockMethodDescriptors[name].set || blockMethodDescriptors[name].get) && name != 'constructor'
        })

        this.menu = document.createElement('menu')
        var container = nodeToMenufy.getClientRects()[0]
        var containerStyle = getComputedStyle(nodeToMenufy)
        var header = nodeToMenufy.querySelector("header").getClientRects()[0]
        var left = container.left
        var top = container.top + header.height
        var width = container.width
        var height = container.height - header.height
        var newMenuStyle = { 
            width, height, left, top, 
            border: containerStyle.borderWidth + ' solid transparent',
        }
        Object.assign(this.menu.style, newMenuStyle)

        menuMethods.forEach(name => {
            var menuItem = document.createElement('li')
            menuItem.textContent = name.replace(/_/g,' ')
            menuItem.addEventListener('click', () => console.log(name) )
            this.menu.appendChild(menuItem)
            
        })

        var dissolveMenu = () => {
            this.menu.remove() // creating a function reference to add and remove lisener
            document.body.removeEventListener('mouseup', dissolveMenu)
            nodeToMenufy.removeEventListener('mousedown', dissolveMenu)
        }
        document.body.addEventListener('mouseup', dissolveMenu)
        nodeToMenufy.addEventListener('mousedown', dissolveMenu)
    }
}

class BlockHeader {
    constructor(options){
        this.header = document.createElement('header')
        this.header.textContent = options.title
        this.button = document.createElement('button')
        this.header.appendChild(this.button)
        this.button.addEventListener('click', event => {
            document.body.appendChild(new BlockMenu(this.header.parentElement).menu)
        })
    }
}

class Block {
    constructor(options = {}){
        this.header = new BlockHeader(options).header
        this.next = document.createElement('div')
        this.next.className = 'next'

        this.textArea = document.createElement('textarea')
        this.textArea.textContent = options.text || ''

        this.container = document.createElement('div')
        this.container.appendChild(this.header)
        this.container.appendChild(this.next)
        this.container.appendChild(this.textArea)
        /* remidner to re-do handleDrag to use default ondragstart event handler */
        this.header.addEventListener('mousedown', handleDrag)
        this.container.onfocus = event => focus(this.container)
        this.container.onblur = event => focus()
        this.textArea.onfocus = event => focus(this.container)
        this.textArea.onblur = event => focus()
        this.textArea.setAttribute('spellcheck','false')
        this.container.constructor = this
        /* Default Style, properties provided here are overrided by a style object on options */
        this.style = Object.assign({
            left: '0px', 
            top: '0px', 
            position: 'relative', 
            width: '400px', 
            height: '200px'
        }, options.style)
        delete options.style
        delete options.text
        this.attributes = Object.assign({type: "Block", id: 't' + Date.now()},options)
    }

    set style(newStyle){
        var {width, height} = newStyle
        delete newStyle.width
        delete newStyle.height
        Object.assign(this.container.style, newStyle) //new Position might have left, top, position, width, height properties
        Object.assign(this.textArea.style, {width, height})
    }

    set textContent(newString){
        this.textArea.textContent = newString
    }

    get textContent(){
        return this.textArea.value
    }


    set attributes(updateObject){
        for(var key in updateObject){
            this.container.setAttribute(key, updateObject[key])
        }
    }

    get attributes(){
        var tempObj = {}
        Array.from(this.container.attributes).forEach(attribute => {
            tempObj[attribute.name] = attribute.value
        })
        return tempObj
    }

    remove_from_window(){
        this.container.remove()
    }

    write_to_disk(){
        // grab filename and PUT to it
        fetch(this.container.getAttribute('filename'), {
            method: 'PUT',
            body: this.textContent
        })
    }

    update_from_disk(){
        // grab filename and GET from it, replace textContent
    }

    become_codemirror(){
        // grab own attributes, return an object to generate new block derivative
        // replace self with new Child
    }

    share_link(){
        // determine link to pull this node
    }
}


function edit(filename){
    fetch(filename)
    .then(res => res.text())
    .then(plainText => {
        document.body.appendChild(new Block({
            style: {
                left: screen.availWidth / 4 + ( Math.random() * ( screen.availWidth / 3 ) ),
                top:  Math.random() * ( screen.availHeight  /  4 ),
                position: 'fixed'
            },
            // draggable: true,
            filename: filename,
            title: filename,
            tabIndex: 1,
            class: 'block',
            text: plainText
        }).container)
    })
    .catch(error => {
        console.error(error)
    })
}
makeConstructorGlobal(Block)
makeConstructorGlobal(BlockHeader)
makeConstructorGlobal(BlockMenu)
