let button = `<div id="configButton">±</div>`
let style = `<style> #configButton {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    width: 20px;
    height: 20px;
    top: 8px;
    right: 8px;
    border-radius: 20px;
    border: 1px solid blue;
  }`
document.body.insertBefore(parseHTML(button), document.body.firstElementChild)
document.head.appendChild(parseHTML(style))