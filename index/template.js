module.exports = props => 
`<html>
  <head>
  <title> Multi Interpreter </title>
  <script id="meta"> meta = ${JSON.stringify(props.meta)} </script>
  ${props.styles.map(styleString => `<style> ${styleString} </style>`).join('')}
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
  ${props.globalScripts.map(scriptString => `<script> ${scriptString} </script>`).join('')}    
  </body>
</html>`