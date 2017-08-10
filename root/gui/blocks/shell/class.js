class ShellBlock extends ConvoBlock {
    constructor(){
        super()
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
            evalBlock.props = evalAttempt
            this.next.appendChild(evalBlock)
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
            return {goodEval: success || String(success)} //coerce falsey values to string
        } catch(localError) {
            return {localError: localError.toString()} //errors are objects but can't be parsed by JSON stringify
        }
    }
    // delete this.textArea
}

customElements.define('shell-block', ShellBlock)