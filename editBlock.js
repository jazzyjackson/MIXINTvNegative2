// this should attach a textarea into the corner of the screen, with a grabbable header. 
// the name and type and position of the new block will 
//to pop out simply means to move the child to a higher level in the tree
// there will have to be some kind of constraint in some cases, to restrict the position / determine the positioning 
var editBlockStyle = document.createElement('style')
editBlockStyle.id = 'editBlockStyle'
editBlockStyle.innerHTML = `
.block.editBlock {
  position: fixed; /* Eventually this should be fixed if top level, relative if child of another editBlock*/
  border: 4px solid black;
  padding-top: 25px;
  background: white;
}
.block.editBlock textarea {
  border-top: 4px solid black;
  outline: none;
}
.block.editBlock.focused {
  z-index: 10;
  box-shadow: 10px 14px 12px 5px rgba(0, 0, 0, 0.58);
}
div.editBlock:before {
    content: attr(filename);
    position: absolute;
    display: block;
    top: 3px;
    text-align: center;
    width: 100%;
}
`
document.head.appendChild(editBlockStyle)

function editBlock(filename){
    newTextArea = document.createElement('textarea')
    newDiv = document.createElement('div')
    
    if( !filename ) filename = prompt("I need a file name to attach this block (relative to current directory. Cannot create a directory from here)")
    else fetch(filename)
         .then(res => res.text())
         .then(plainText => newTextArea.value = plainText)

    newDiv.className = 'block editBlock'
    newDiv.setAttribute('filename', filename)
    newDiv.setAttribute('tabIndex', 1)
    newDiv.id = Date.now()
    newDiv.style.left = screen.availWidth / 4 + ( Math.random() * ( screen.availWidth / 3 ) )
    newDiv.style.top = Math.random() * ( screen.availHeight  /  4 )
    newTextArea.style.width = 400
    newTextArea.style.height = 200    
    newTextArea.onfocus = event => focus(event.target.parentNode)
    newTextArea.onblur = event => focus()
    newDiv.onfocus = event => focus(event.target)
    newDiv.onblur = event => focus()
    newDiv.appendChild(newTextArea)
    newDiv.addEventListener('mousedown', handleDrag)
    this === window && document.body.appendChild(newDiv)
    return newDiv
}

function saveBlock(filename){
    var possibleFile = document.querySelector(`[filename="${filename}"] > textarea`)
    if(!possibleFile) return "no such file"
    fetch(filename, {
        method: 'PUT',
        body: possibleFile.value
    })
}

function focus(htmlNode){
    //can be called to remove focused style from all nodes and apply className focused to a node, or called with no argument to just unfocus all
    Array.from(document.getElementsByClassName('focused'), node => node.classList.remove('focused'))
    htmlNode && htmlNode.classList.add('focused')
}