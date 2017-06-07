module.exports = async function parse(ctx, next){
  await next()
}

//The idea with the editor is to build a file retrieval/saving constructor function that allows for tiling of editors across a pannable area, but that that will scale out to all the other nodes. Notes, programs... Do the div -> textarea -> shadowroot pattern. Should be easy to remove shadowroots if an editor is out of view for a few moments -> snip the shadowroot, leave it as a plaintext text area, but if its position intersects with the viewable workspace than reapply the constructor functions. It can be made to be seamless. Shold have a function that snips shadowroots and applies blur when you zoom out. Actualy just blur them if they're inactive -> waiting to be constructed.

//This should segue into the goal of generating a usable workspace as fast as possible. Even if remote files are being fetched and constructor programs are being loaded from disk, the pieces can be styled from the config object and drawn as fast as possible, letting you create new ndoes locally (even if they take a moment to save to disk. I think if done correctly, the interactivity on slow networks will be reason enough to start cloning sites and messaging platforms.)
//New computer, slow network.