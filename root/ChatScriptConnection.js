const net = require('net');
const child_process = require('child_process').spawn
const path = require('path')
const os = require('os')
/*more information on the net built-in module of node in the docs:
https://nodejs.org/api/all.html#net_net_connect_options_connectlistener
allows us to make raw TCP connections*/

module.exports = class ConnectionHandler {
  constructor(chatscript_config){
    this.chatscript_config = chatscript_config
    this.username = chatscript_config.defaultUser
    this.botname = chatscript_config.defaultBot
  }

  chat(message, username, botname){ 
    //guest and harry are default values if chat is called with only a message
    let {port, host, defaultBot, defaultUser} = this.chatscript_config
    username = username || defaultUser // set user if not passed to func
    botname = botname || defaultBot //set bot if not passed to func
    return new Promise((resolve, reject)=>{
        var client = net.createConnection(this.chatscript_config)
        client.on('connect', () => client.write([username,botname,message].join('\0') + '\0'))
        /* botResponse is returned as a byte buffer. Coerce to string, then parse if parseable, then resolve promise */
        client.on('data', botResponse => resolve(digestOOB(botResponse.toString())))
        client.on('error', error => reject(error))
    })
  }
}

function digestOOB(chatresult){
    try {
      var result = JSON.parse(chatresult)
      result.goodchat = result.output
      delete result.output
      return result
    } catch(e) {
      return {goodchat: chatresult}
    }
}

//the chatbot can modify the configuration of a page by updating a fact, reserializing the JSON, and putting to the filepath, and then the bot via eval or the server via fs watch can force the update of the path to the new configuration. 