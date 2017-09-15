document.body.addEventListener('mouseup', cancelDrag)

function createUpdatePos({clientX, clientY}){ //this is a function creator. When a mouse/touchdown event occurs, the initial position
  var theLastX = clientX                      //is enclosed in a function, those variables are updated on mousemove and will persist
  var theLastY = clientY                      //as long as the function exists. On touch/mouseup events, the function is destroyed (the variable it was assigned to is reassigned null)
  return function({clientX, clientY, buttons}){
      var movementX = clientX - theLastX
      var movementY = clientY - theLastY
      theLastX = clientX
      theLastY = clientY
      var currentXpos = parseInt(document.activeElement.style.left)
      var currentYpos = parseInt(document.activeElement.style.top)
      document.activeElement.style.left = (currentXpos + movementX) + 'px'
      document.activeElement.style.top = (currentYpos + movementY) + 'px'
  }
}

function handleDrag(event){
    console.log(this)
    console.log(event.target)
    if(event.target != this) return undefined // exit function if a mousedown managed to bubble up to me.
    window.updatePos = createUpdatePos(this.parentElement)
    document.body.addEventListener('mousemove', window.updatePos)
    document.body.addEventListener('mousemove', window.cancelDrag)
    document.body.setAttribute('dragging',true) //textArea would occasionally steal focus because it thought I wanted to type. I'll disable in during the move.'
}

function cancelDrag(){
    if(!event.buttons){
        document.body.removeEventListener('mousemove', window.updatePos)
        document.body.setAttribute('dragging',false) //textArea would occasionally steal focus because it thought I wanted to type. I'll disable in during the move.'
    }
}