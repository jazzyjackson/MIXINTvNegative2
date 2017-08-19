class ShellBlock extends ConvoBlock {
    constructor(options){
        super(options)
    }

    connectedCallback(){
        this.init()
    }
    
    handleSubmit(event, options = {headless: false}){ // overwrite handleSubmit method of prototype ConvoBlock, to eval first
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener
        var valueToSubmit = this.input.value || '...'
        var evalAttempt = this.evalledInWindow(valueToSubmit)  // try to eval submit in window first
        if(evalAttempt.goodEval){
           var evalBlock = new MessageBlock({
                input: valueToSubmit,
                headless: options.headless
            })
            this.next.appendChild(evalBlock)
            evalBlock.props = evalAttempt
        } else {
            console.log(evalAttempt)
            this.next.appendChild(new MessageBlock({
                action: location.pathname + '?' + encodeURI(valueToSubmit),
                method: 'POST',
                input: valueToSubmit,
                headless: options.headless
            }))
        }   

        this.input.value = '' // reset input to blank (if there's not a keepInput prop on options)
    }

    evalledInWindow(stringToEval){
        if(stringToEval.indexOf('cd') == 0){
            var newDir = stringToEval.slice(3).trim()

            if(newDir == '.') return {goodEval: 'OK'}
            if(newDir == '..'){
                var newPath = location.pathname.split('/')
                newPath.pop()
                newPath.pop()
                newPath = newPath.join('/') + '/' 
                history.pushState({}, null, newPath)
                return {goodEval: 'OK'}
                //new url is the rest of the string after you slice off the first slash and slice after the second slash
            }
            if(newDir == '~'){
                history.pushState({}, null, '/') 
                return {goodEval: 'OK'}
            }
            if(/[^\\/]/.test(newDir)){
                //if the last character is a black slash or forwardslash, and the first character is not,
                //append the new path to the pathname
                history.pushState({}, null, location.pathname + /[\\/]\$/.test(newDir) ? newDir + '/' : newDir)
                return {goodEval: 'OK'}
            } else if (/^[\\/]/.test(newDir)){
                //if the first character is a slash
                history.pushState({}, null,  /[\\/]\$/.test(newDir) ? newDir  + '/' : newDir)
                return {goodEval: 'OK'}
            }
        }
        if(stringToEval.trim() == 'clear'){
            setTimeout(()=>Array.from(document.querySelectorAll('message-block'), node => node.remove()),0)
            return {goodEval: 'OK'} // remove all the message blocks AFTER returning 'OK'
        }
        // if it wasn't cd or clear, then eval it as a string
        try {
            var success = eval(stringToEval)
            var goodEval = typeof success == 'object' ? JSON.stringify(decycle(success),'',4) : String(success)
            return { goodEval } //coerce falsey values to string
        } catch(localError) {
            return {localError: localError.toString()} //errors are objects but can't be parsed by JSON stringify
        }
    }
    // delete this.textArea
}

customElements.define('shell-block', ShellBlock)

function decycle(object) {
    var objects = new WeakMap(); 
    return (function derez(value, path) {
        var old_path;   // The path of an earlier occurance of value
        var nu;         // The new object or array
        if (
            typeof value === "object" && value !== null &&
            !(value instanceof Boolean) &&
            !(value instanceof Date) &&
            !(value instanceof Number) &&
            !(value instanceof RegExp) &&
            !(value instanceof String)
        ) {
            old_path = objects.get(value);
            if (old_path !== undefined) {
                return {$ref: old_path};
            }
            objects.set(value, path);
            if (Array.isArray(value)) {
                nu = [];
                value.forEach(function (element, i) {
                    nu[i] = derez(element, path + "[" + i + "]");
                });
            } else {
                nu = {};
                Object.keys(value).forEach(function (name) {
                    nu[name] = derez(
                        value[name],
                        path + "[" + JSON.stringify(name) + "]"
                    );
                });
            }
            return nu;
        }
        return value;
    }(object, "$"));
};