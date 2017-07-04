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
        this.header = parseHTML(`
            <header>
                ${options.title}
                <button></button>
            </header>
        `)
        this.header.querySelector('button').addEventListener('click', event => {
            document.body.appendChild(new BlockMenu(this.header.parentElement).menu)
        })
        this.header.addEventListener('mousedown', handleDrag)

        // this.header = document.createElement('header')
        // this.header.textContent = options.title
        // this.button = document.createElement('button')
        // this.header.appendChild(this.button)
        // this.button.addEventListener('click', event => {
            // document.body.appendChild(new BlockMenu(this.header.parentElement).menu)            
        // })
    }
}

class Block {
    constructor(options = {}){
        this.block = parseHTML(`
            <div>
                <div class='next'></div>
                <textarea spellcheck=false 
                          onfocus="focus(this.parentElement)" 
                          onblur="focus()">
                          ${options.text || ''}
                </textarea>
            </div>
        `)

        this.block.insertBefore(new BlockHeader(options).header, this.block.firstChild)
        this.textarea = this.block.querySelector('textarea')

        // this.header = new BlockHeader(options).header
        // this.next = document.createElement('div')
        // this.next.className = 'next'

        // this.textArea = document.createElement('textarea')
        // this.textArea.textContent = options.text || ''

        // this.container = document.createElement('div')
        // this.container.appendChild(this.header)
        // this.container.appendChild(this.next)
        // this.container.appendChild(this.textArea)
        /* remidner to re-do handleDrag to use default ondragstart event handler */
        // this.container.onfocus = event => focus(this.container)
        // this.container.onblur = event => focus()
        // this.textArea.onfocus = event => focus(this.container)
        // this.textArea.onblur = event => focus()
        // this.textArea.setAttribute('spellcheck','false')
        // this.container.constructor = this
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

        this.attributes = Object.assign({
            type: "Block", 
            id: 't' + Date.now()
        },options)
    }

    set style(newStyle){
        var {width, height} = newStyle
        delete newStyle.width
        delete newStyle.height
        Object.assign(this.block.style, newStyle) //new Position might have left, top, position, width, height properties
        Object.assign(this.textarea.style, {width, height})
    }

    set attributes(updateObject){
        for(var key in updateObject){
            this.block.setAttribute(key, updateObject[key])
        }
    }

    get attributes(){
        var tempObj = {}
        Array.from(this.block.attributes).forEach(attribute => {
            tempObj[attribute.name] = attribute.value
        })
        return tempObj
    }

    remove_from_window(){
        this.block.remove()
    }

    write_to_disk(){
        // grab filename and PUT to it
        fetch(this.block.getAttribute('filename'), {
            method: 'PUT',
            credentials: 'same-origin',
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
    fetch(filename, {credentials: 'same-origin'})
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
        }).block)
    })
    .catch(error => {
        console.error(error)
    })
}
makeConstructorGlobal(Block)
makeConstructorGlobal(BlockHeader)
makeConstructorGlobal(BlockMenu)
