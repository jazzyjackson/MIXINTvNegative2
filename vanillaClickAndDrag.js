// this might be unique to edit Blocks, but I think that will be my prototype. Always a Div > TextArea, ShadowRoot. TextArea will always be firstElementNode
function createUpdatePos({clientX, clientY}){ //this is a function creator. When a mouse/touchdown event occurs, the initial position
  var theLastX = clientX                      //is enclosed in a function, those variables are updated on mousemove and will persist
  var theLastY = clientY                      //as long as the function exists. On touch/mouseup events, the function is destroyed (the variable it was assigned to is reassigned null)
  return function({clientX, clientY}){    
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
  if(event.target != this) return undefined // exit function if a mousedown managed to bubble up to me.
  document.body.removeEventListener('mousemove', window.updatePos) // edge case where the mouseup didn't register and an updatePos stuck around - have to remove listener before we delete a reference to this function by overwriting updatePos with a new function!
  window.updatePos = createUpdatePos(this)
  document.body.addEventListener('mousemove', window.updatePos)
  this.firstElementChild.disabled = true //textArea would occasionally steal focus because it thought I wanted to type. I'll disable in during the move.'
}

document.body.addEventListener('mouseup', () => {
  if(!window.updatePos) return undefined
  document.activeElement.firstElementChild.disabled = false // don't re-enable textarea if nothing was having their position updated
  document.body.removeEventListener('mousemove', updatePos)
  window.updatePos = null   
})
// There exists an edge case where you click and move the mouse out of the box very quickly (you kind of have to try to break it like this, but it could happen)
// I don't know exactly what happens, but you get a little 'not-allowed' cursor and the next time you mouseup - it won't fire the event listener! 
// if the mouseup doesnt fire, the draggable block will follow you around even after you let go of the buttons
// if you click on a draggable object again it will clear itself up, but this gives a user the basic debugging option of hitting escape to cancel current selection

document.body.addEventListener('keydown', event => {
  if(event.key == 'Escape'){
    document.activeElement.firstElementChild.disabled = false
    document.body.removeEventListener('mousemove', window.updatePos)
    window.updatePos = null
  }
})