/* ProtoBlock has no style or template, 
it's only meant to hold the utility methods that all blocks are expected to inherit. 
There is no custom element. no document.createElement('proto-block'), just, class extends ProtoBlock */

class ProtoBlock extends HTMLElement {
    constructor(){
        super()
    }
    /* get actions that should be exposed to menu block from this class */
    static get actions(){
        return {
            "become": {
                func: this.prototype.become,
                args: [{enum: Array.from(document.querySelectorAll('template'), template => template.getAttribute('renders'))}]
            }
        } 
    }
    /* get list of actions available on every class on the prototype chain and return an object to render MenuBlock */
    get actionMenu(){
        console.log("In the action menu getter this is",this)
        /* this getter walks up the prototype chain, invoking 'get actions' on each class, then with that array of menu objects, reduce Object assign is called to return an amalgamated object of menu options */
        return this.superClassChain.map(superclass => superclass.actions).reduce((a,b) => Object.assign(a,b))
    }

    static get superClassChain(){
        /* is there a javascript built in I don't know about? Chrome seems to resolve this automatically in inspector, can I just ask an object for its list of prototypes instead of iterating ? */
        var superClassChain = []
        var superclass = this /* this is the part thats different for the class method: we can call the prototype of the class */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }
        return superClassChain 
    }

    get superClassChain(){
        var superClassChain = []
        var superclass = this.constructor /* this is the part thats different for the instance method: we have to call the constructor before we call for the prototype */
        while(superclass.name != 'HTMLElement'){
            superClassChain.push(superclass.prototype.constructor)
            superclass = superclass.__proto__
        }        
        return superClassChain
    }

    init(){
        /* this calls every connectedCallback up the class inheritence chain or whatever you want to call it */
        if(this.initialized) return null
        /* but only calls it once if initialized flag isn't already set */
        this.initialized = true 
        this.innerHTML = '' // don't remember if this is necessary...
        this.appendChild(document.querySelector(`[renders="${this.tagName.toLowerCase()}"]`).content.cloneNode(true))  
        this.head = this.querySelector('b-head') /* Had a lot of back and forth to organize the graph with each node having a next property */
        this.next = this.querySelector('b-next') /* I thought it might be a lot more elegant to have each custom element have its own shadowroot, So that the topmost lightDOM would just be a graph of custom elements. */
        this.body = this.querySelector('b-body') /* But ShadowRoots introduce a lot of repition, loading the whole stylesheet per node, and for customization reasons I actually don't want to encapsulate style */
        this.id = 'block' + String(Math.random()).slice(-4) + String(Date.now()).slice(-4) //random id for convenience. random number + time to reduce likelihood of collisions
        this.props = this.options
        /* call in reverse order to invoke base class connectedCallback first. */
        this.superClassChain.reverse().forEach(superClass => {
            /* this also expected connectedCallback to exist on every class, so just connectedCallback(){init()} if you don't need to do anything, just keep it as a template */
            if(superClass.prototype.connectedCallback){
                superClass.prototype.connectedCallback.call(this)
            }
        })
        /* I'm expecting connectedCallbacks to be effectively blocking so that init is fired once all methods and HTML nodes are on the DOM, that's my intention anyway */
        this.dispatchEvent(new Event('init')) /* fire load event so other elements can wait for the node to be initialized */
        console.log(`A ${this.tagName.toLowerCase()} was initialized`)
    }

    /* to be more extensible this should probably go up the superclasschain accumulating static get keepAttributes, and using that array to skip attribute removal */
    clear(){
        /* a method for destroying attributes, to reset the block, but there's probably some attributes you want to keep. tabIndex and style needs to exist for click and drag (active element works off focus, updates from style attributes) */
        let keepAttributes = ['id','style','tabIndex']
        return Array.from(this.attributes, attr => keepAttributes.includes(attr.name) || this.removeAttribute(attr.name))
    }

    become(blockType){
        var newBlock = document.createElement(blockType)
        newBlock.props = this.props
        this.replaceWith(newBlock)
        return newBlock
    }

    set props(data){
        if(!data){
            return this.props
        }
        if(typeof data != 'object'){ // convert strings and numbers into the property data, containing the value of data, so it can be appended to and reacted to normally
            data = {data}
        }
        Object.keys(data).forEach(key => {
            let newData = data[key]
            let oldData = this.getAttribute(key)
            /* check if attribute is truthy, append data to existing attributes, create attribute otherwise */
            this.setAttribute(key, oldData ? oldData + newData : newData)
        })
        return this.props
    }

    get props(){
        /* an ugly way to coerce a NamedNodeMap (attributes) into a normal key: value object. 
        Use ES6 enhanced object literals to eval node.name as a key, so you have an array of objects (instead of attribute) and then you can just roll it up with reduce */
        return Array.from(this.attributes, attr => ({[attr.name]: attr.value}))
                    .reduce((a, n) => Object.assign(a, n)) // You would think you could do .reduce(Object.assign), but assign is variadic, and reduce passes the original array as the 4th argument to its callback, so you would get the original numeric keys in your result if you passed all 4 arguments of reduce to Object.assign. So, explicitely pass just 2 arguments, accumulator and next.
    }
}