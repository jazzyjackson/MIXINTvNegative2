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
    switch(os.type()){
      case 'Darwin': this.chatscript_config.app = 'MacChatScript'; break;
      case 'Windows_NT': this.chatscript_config.app = 'chatscript'; break;
    }
  }

  log(output){
    if(this.chatscript_config.debug == true) console.log(JSON.stringify({debug: output}))
  }

  //Someday you'll be able to ask the bot why its broken, but until then, this switch case diagnosis will have to do
  debug(){
    switch(os.type()){
      case 'Darwin': console.log(`I was unable to start ChatScript server. You likely need to navigate to ChatScript/SRC and run 'make server' and try again`)
    }
  }

  chat(message, username, botname){ 
    //guest and harry are default values if chat is called with only a message
    let {port, host, defaultBot, defaultUser} = this.chatscript_config
    username || (username = defaultUser) // set user if not passed to func
    botname || (botname = defaultBot) //set bot if not passed to func
    return new Promise((resolve, reject)=>{
        var client = net.createConnection(this.chatscript_config)
        client.on('connect', () => client.write([username,botname,message].join('\0') + '\0'))
        client.on('data', botResponse => resolve(new digestOOB(botResponse.toString())))
        client.on('error', error => reject(error))
    })
  }

  startServer(){
    if(this.chatscript_config.app){
        let {port, app} = this.chatscript_config
        let argarray = (app == 'chatscript') ? [`port=${port}`] : [] //necessary argument array for windows server
        this.log(`cwd: ${path.join(__dirname, '../../')} \ncmd: ./BINARIES/${app} ${argarray.join('')}`) //for debugging
        let chatserver = child_process(`./${app}`,argarray,{cwd: path.join(__dirname, '../../../BINARIES')})
        chatserver.stdout.on('close', error => this.log('closed connection with chatscript server.'))
        chatserver.on('error', this.debug)
        this.log(`starting chatscript as a child process of connectionHandler.js on localhost:${port}`)
    } else {
        this.log(`I couldn't detect your operating system, so chatscript was not started.`)
    }
  }
}

function digestOOB(chatresult){
  OOBregex = /\s(\w*)=(\S*)/g
  var match = OOBregex.exec(chatresult)
  while(match){
    this[match[1]] = match[2]
    match = OOBregex.exec(chatresult)
  }

  chatregex = /\[.*\](.*)/
  chatmatch = chatregex.exec(chatresult)
  if(chatmatch){
    this.successfulChat = chatmatch[1]
  } else {
    this.successfulChat = chatresult
  }
}

//the chatbot can modify the configuration of a page by updating a fact, reserializing the JSON, and putting to the filepath, and then the bot via eval or the server via fs watch can force the update of the path to the new configuration.