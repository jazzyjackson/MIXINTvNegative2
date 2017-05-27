module.exports = props => 
`<html>
  <head>
  <title> Multi-Interpreter! </title>
  <script id="meta"> meta = ${JSON.stringify(props.meta)} </script>
  <style>${props.styles.join('\n')}</style>
  </head>
  <body>
    <div id='convoContainer'>
      <form id='form'>
        <input id='input' type="text" placeholder="Say something new">
      </form>
    </div>
    <script>${props.globalScripts.join('\n')}</script>
  </body>
</html>`