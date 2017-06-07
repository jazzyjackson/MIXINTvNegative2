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
    if(this.chatscript_config.debug == true) console.log(output)
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
      let client = net.connect(this.chatscript_config, () => {
        this.log(`connection established to ${host}:${port}`)
        /*on a successful connection, write to the socket with 3 arguments, null char (\u0000) terminated)
        details of this message protocol may be found in DOCUMENTATION/CLIENTS-AND-SERVERS/ChatScript-ClientServer-Manual */
        this.log(String.raw`${username}\0${botname}\0${message.trim()}\0`) 
        client.write(`${username}\0${botname}\0${message}\0`)
      })
      client.on('data', botResponse => {
        let data = botResponse.toString()
        //if the bot returned JSON, parse it and use that as the response object. 
        //Otherwise, create a new object with an output property
        let response = (data[0] === '{') ? JSON.parse(data) : {output: data} 
        // console.log(response)        
        resolve(response);
        client.end();
      })
      client.on('end', () => {
        //this will reject the promise only if the connection is closed before data is received. 
        //If the promise is resolved by receiving data, great, this rejection won't make a difference
        reject(`the server at ${host}:${port} closed the connection.`)
      })
      client.on('error', error => {
        reject(error)
      })
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

