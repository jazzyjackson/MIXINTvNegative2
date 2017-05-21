module.exports = props => 
`<html>
  <head>
  <title> Multi Interpreter </title>

  </head>
  <body>
    <div id='menuContainer'>
      <select name='addon'>
        <option value='style'> Style </option>
      </select>
      <button id='addonConfirm'> Confirm </button>
    </div>
    <div id='convoContainer'>
      <form id='form'>
        <input id='input' type="text" placeholder="Say something new">
      </form>
    </div>
    <script>
      const fromId = document.getElementById.bind(document)
      const $ = document.querySelectorAll.bind(document)
      const form = fromId('form')
      const input = fromId('input')
      const convoContainer = fromId('convoContainer')

      form.onsubmit = event => {
        event.preventDefault()
        convoContainer.insertBefore(parseHTML("<div class='input'>" + input.value + "</div>"),form)
        convoContainer.insertBefore(parseHTML("<div class='output'>" + tryEval(input.value) + "</div>"),form)
        input.value = ''
        form.scrollIntoView()
      }

      function parseHTML(string){
        var tempNode = document.createElement('div')
        tempNode.innerHTML = string
        return tempNode.firstChild
      }
      function tryEval(string){
        try {
          return eval(string)
        } catch(e) {
          console.log(Object.keys(e))
          return 'Error'
        }
      }
      
    </script>
  </body>
</html>`