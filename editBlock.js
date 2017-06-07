// this should attach a textarea into the corner of the screen, with a grabbable header. 
// the name and type and position of the new block will 
//to pop out simply means to move the child to a higher level in the tree
// there will have to be some kind of constraint in some cases, to restrict the position / determine the positioning 
var editBlockStyle = document.createElement('style')
editBlockStyle.innerHTML = `
.block.editBlock {
  position: absolute;
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
    content: attr(filepath);
    position: absolute;
    display: block;
    top: 3px;
    text-align: center;
    width: 100%;
}
`
document.head.appendChild(editBlockStyle)

function editBlock(extantEditBlock, newName){
  if(! extantEditBlock || newName) newName = prompt("I need a file name to attach this block (relative to current directory. Cannot create a directory from here)")
  if(!extantEditBlock){
    extantEditBlock = document.createElement('div')
    extantEditBlock.className = 'block editBlock'
    extantEditBlock.setAttribute('filepath', newName)
    extantEditBlock.id = Date.now()
    extantEditBlock.style.left = screen.availWidth / 2 + Math.random() * screen.availWidth / 4
    extantEditBlock.style.top = Math.random() * screen.availHeight  / 4
    newTextArea = document.createElement('textarea')
    newTextArea.style.width = 400
    newTextArea.style.height = 200    
    newTextArea.onfocus = event => {
      var oldFocus = document.querySelector('.focused')
      oldFocus && oldFocus.classList.remove('focused')
      event.target.parentNode.classList.add('focused')
    }
    extantEditBlock.appendChild(newTextArea) 
    document.body.appendChild(extantEditBlock)
    //if editBlock is passed an HTML node, it will apply all the necessary classes to it. else it will use a fresh textarea/div
  }
  
}