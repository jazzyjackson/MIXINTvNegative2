# multi-interpreter
An extensible and remixable space for cooperating with your network.

Cooperating may include:
- Uploading and modifying media on a shared, versioned filesystem
- Communicating in chatrooms of your own design
- Co-authoring chatbot personalities that control the computer

Your network may include:
- close friends and family
- your local wifi router
- distant acquiantences 
- transoceanic fiber optics
- strangers with a common interest
- low-cost cloud infrastructure
- coworkers and business partners
- physical computers you control

When you start a multi-interpreter, you're given a link that makes it accessible to anyone on the same network. If you're hosted in the cloud, or have an ISP that allows incoming connections on ports 80 and 443, the whole world is the same network. Otherwise, participants in the same room can use this shared online space without any connection to the wider internet.

### Command & Convo
Whether operating in single-player or multi-player, the interpreter is centered around two basic goals: to command the computer, and to have conversations.

The first screen you see when connected to the interpreter's address could be welcoming or intimidating, based on your past experience with command line interfaces. It was my experience that being able to tell a computer exactly what to do was fun, so I became a programmer. But the trouble with a computer doing exactly what you tell it is that you're always a typo away from destroying files and breaking installations, so people shy away from copy-pasting code into their console.

Conversational interfaces have found a new audience in millions of people who talk to their Alexas and Siris and Xiaoices, and multi-interpreter brings this natural language computer control back to its text-interface roots.

Computers are typically unforgiving machines that take a lot of patience to get a feel for, and even engineers make mistakes. Multi-interpreter paired with chatscript personalities aims to provide a computer that knows about itself - an automated conversation that can answer questions about its own code. The chatbot even has the ability to modify its own configuration and read its own error logs.

If you don't know a word of machine language, you can still tell a multi-interpreter what to do and it will try and offer its capabilities. It may take a lot of babble and nonsensical replies to start figuring out what you can talk about, but that's to be expected when two parties meet without a common language.

The expected outcome is some kind of computer-creole, where natural language carries the necessary information to get the machine to do what you want, and the machine expresses itself the best it can with a limited and mechanical knowledge of your language. (Creole and its relevance to AI is discussed in Nicoloas Negroponte's The Architecture Machine, 1970, check it out)


### Block and Tackle Programming
Arranging simple machines into sophisticated systems

Taking advantage of the graph-based nature of HTML, block-and-tackle provides a flexible way to arrange information and processes

The parts and processes of a system can be prototyped like a mind map,but active nodes can run javascript that walks up and down the tree its a part of, reading and/or modifying its siblings, children, and ancestors. 

So a prototype may simply arrange ideas under umbrellas representing different components, but code can be written on the back of each node, so that nodes start containing modal information. Notes that become documentation, and a visual separation of concerns that encourages thoughtful modularity and code testing.

# Server Options: Timeshare | Stateless

Timeshare is designed for a single persistent unix machine with many users. It 'logs on' visitors to your server with a node server just for them. All requests will be executed within this environment, which can have permissions and environment variables of its own.

Stateless has a lot of functionality thrown out the window - its purpose is to authenticate and serve. It's appropriate if you don't want the added complexity of a multi-user machine and/or your app lives in cloud containers and you need it to not care who's who.

# Interpret Modes: Bash-first | Bot-first

The heart of multi-interpreter are promise-chains that try a series of functions until one succeeds. By default, I try bash, then node, then chatscript. I'm assuming the first person to use the application is the person who installed it, so the chatbot stays transparent at first, only popping up when your input caused bash and node to throw an error. Subsequently, chatbot can be programmed to digest those errors and respond according to their content. 

New users are signed in as a nobody by default, so they don't have rights to delete files or reboot the system and otherwise f*** ur s*** up.

However, if you want certain users (say, everyone except you) to talk only to the bot, it is simply a matter of specifying a different interpreter mode.
Bot-first prohibits the execution of arbitrary bash commands. Instead, the chatbot decides how to respond to a request, which MAY INCLUDE a bash command. That is, you can write chatscript that triggers bash commands on an untrusted users' behalf. So system administrators could set up bash scripts that are run when requested by a particular user (by the way chatbot also knows your username and can withhold or provide information based on username, it's all up to how you write the chatscript)


# From Sphinx to Root, duplicating and modifying applications

The included application aims to provide essential features to allow online collaboration with zero set up. But you might want your website to have less interactions - 

If you're interested in a basic interface to allow anyone on the internet to chat with your chatbot, you don't even have to go past here. Sphinx.html includes a basic chat interface, and if you write a script that never redirects users to the application, they can talk to your bot all day long. The default usage is to determine if a user is human and/or trustworthy and redirect users to the website at that point.

## Compatibility notes
Get Node 8
Get Chrome (uses customElements and ResponseStream API, web standards that will eventually be supported by other browsers. Just chrome for now. Or you can detect user agent and provide polyfill)

## Why free?

Because all the technology its built on was given away for free, and because it's really not my idea and I'm not going to patent it and take credit.

Third party software used by multi-interpreter includes:
- CodeMirror, under MIT license by Marijn Haverbeke
- ChatScript, under MIT license by Bruce Wilcox
- git, under General Public License by many authors
- the rest of GNU/Linux under General Public License

## License
License is UIUC/NCSA: Do the thing! No restriction on commercial use, no warranty. Your derivative application shouldn't imply endorsement by me.

Copyright (c) 2017 Colten Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
Neither my name nor the names of multi-interpreter's contributors may be used to endorse or promote products derived from this Software without specific prior written permission.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.
