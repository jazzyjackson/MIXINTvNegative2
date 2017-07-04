// some global helper functions that don't really fit within more specific encapsulations

function focus(htmlNode){
    //can be called to remove focused style from all nodes and apply className focused to a node, or called with no argument to just unfocus all
    Array.from(document.getElementsByClassName('focused'), node => node.classList.remove('focused'))
    htmlNode && htmlNode.classList.add('focused')
}

function isElement(htmlNode){
    return htmlNode && htmlNode.__proto__.__proto__ === HTMLElement.prototype
}

function parseHTML(string){
    var tempNode = document.createElement('div')
    tempNode.innerHTML = string.trim()
    return tempNode.firstChild
}

var fromId = document.getElementById.bind(document)
var $ = document.querySelectorAll.bind(document)

function makeConstructorGlobal(aClass){
    window.constructors = Object.assign({}, window.constructors, {[aClass.name]: aClass})
}