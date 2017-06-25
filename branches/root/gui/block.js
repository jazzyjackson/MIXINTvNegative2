class BlockHeader {
    constructor(options){
        this.header = document.createElement('header')
        this.header.textContent = options.title
        this.menu = document.createElement('menu')
        this.header.appendChild(this.menu)
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
        this.attributes = options
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

    remove(){
        this.container.remove()
    }
    save(){
        // grab filename and PUT to it
        fetch(this.container.getAttribute('filename'), {
            method: 'PUT',
            body: this.textArea.value
        })
    }
    update(){
        // grab filename and GET from it, replace textContent
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