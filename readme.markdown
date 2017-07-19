# multi-interpreter

I have this dream of writing a web server that walks you through the process of configuring itself for your needs.
Kind of like that cow in the Restaurant at the End of the Universe that recommends its own liver, and rolls its eyes when you ask for a salad.

The first step is to build a platform that can do all the work of your typical webserver, but has the power to change its own configuration and read its own error messages.

But before trying to explain what a self-aware web server looks like, I want to provide a minimal configuration that is immediately useful.

Multi-intrepreter aims to make it easy to do all the things computers are good at, including:
- Sharing files on a local network, or uploading files to a server to share online
- Message passing between friends and co-workers
- Modify the user interface to access and edit messages, files, and programs
- Scheduling assistance to set alarms and run programs
- Explain what available programs do and offer you many options on how to run them
- Archiving files, keeping records and tracking changes to all of them

On top of this central functionality, an application can be cloned and modified. 
- Serve a simple static website
- allow user actions to fire off specific functions - store or fetch data, send a text message
- give a custom interface to the chatbot, even design a video game around the chat script.

# Operator, Bookkeeper, and Keymaker

**Operator.js connects your calls.**

It is the top level script that does all the process creation and supervising, so once you git clone, you can run 'node operator' to start listening for HTTP requests. It also listens for input on stdin, so once you start the operator, you can still use the shell. Input is piped to the interpret function, explained further down, allowing you to run bash commands, javascript one-liners, or plain English to be replied to by the system's ChatScript personality.

**Bookkeeper.js takes note of every transaction made by the Operator.**

Each user gets a separate log file, including the system itself. System errors are kept in error.log. They are written in JSON for easy interpretation by other programs. Each log includes information about GET/POST/PUT/DELETE request made by that user, how many bytes of data were transfered, along with CPU and RAM usage by that users' Switchboard.

**Keymaker.js sets cookies and reads magic URLs**

By designing a server meant to serve only a few hundred people, I get to cut a big corner in authorization - I don't have to store user sessions in a database. Keymaker simply maps random numbers to user ids. Keymaker also provides the function allowing you to decide what environment variables are set in that users sessions - you can decide what usernames have what unix uids, whether they talk to the bot or can execute arbitrary bash commands, and which directory they're contained in (e.g. what application they are served.)

# Root, Logs, and Spiders
You can think of logs as slices of a branch, an artifact that lets analyze the rings to determine what happened over time. Thankfully for our computer program, we don't have to destroy the tree to read its logs.

If you're familiar with git branches, you'll have to zoom out a bit - a repository may have many branches, but it will at least have a master branch, which implies that there is a larger tree to attach to. The host machine's filesystem is that tree that contains many repos and their master branches.

Spiders are programs that crawl filesystems and computer networks and carry out some task for you. Basic spiders might include, download any new messages from a POP server, fetch the weather.
They can be accessed via POST requests from client side applications or by a ChatScript server, allowing your chatbot to digest data from the wider internet.

# Root: Interpret, Switchboard, and GUI
Convologs are JSON files with a single message per line, one file for each user.
This allows the recording and interweaving of messages from many users, so anyone within a particular directory has the option to leave public messages. Chatroom functionality can be had if you connect to a "log watch" program to stream new file changes to you.
Figtrees, short for Configuration Trees, are directed graphs representing the state of a workspace associated with a particular user. The file is read by a client to initialize and position all the blocks a particular user was working on.
# Root: Convologs, Figtrees, and FigJam

# Server Options: Timeshare | Stateless

Timeshare is designed for a single persistent unix machine with many users. It 'logs on' visitors to your server with a node server just for them. All requests will be executed within this environment, which can have permissions and environment variables of its own.

Stateless has a lot of functionality thrown out the window - its purpose is to authenticate and serve. It's appropriate if you don't want the added complexity of a multi-user machine and/or your app lives in cloud containers and you need it to not care who's who.

# Interpret Modes: Bash-first | Bot-first

The heart of multi-interpreter are promise-chains that try a series of functions until one succeeds. By default, I try bash, then node, then chatscript. I'm assuming the first person to use the application is the person who installed it, so the chatbot stays transparent at first, only popping up when your input caused bash and node to throw an error. Subsequently, chatbot can be programmed to digest those errors and respond according to their content. 

New users are signed in as a nobody by default, so they don't have rights to delete files or reboot the system and otherwise f*** ur s*** up.

However, if you want certain users (say, everyone except you) to talk only to the bot, it is simply a matter of specifying a different interpreter mode.
Bot-first prohibits the execution of arbitrary bash commands. Instead, the chatbot decides how to respond to a request, which MAY INCLUDE a bash command. That is, you can write chatscript that triggers bash commands on an untrusted users' behalf. So system administrators could set up bash scripts that are run when requested by a particular user (by the way chatbot also knows your username and can withhold or provide information based on username, it's all up to how you write the chatscript)

# Magic Links and Session Cookies

 Multi-interpreter uses magic links and session cookies to provide security to your application. As opposed to serving the full application to every web request, any incoming request that does not include a valid cookie can be redirected to a page prompting the user to acquire a magic link - a random token that the server creates and identifies you as a unique user.

# Timeshare or Stateless



# From Sphinx to Root, duplicating and modifying applications

The included application aims to provide essential features to allow online collaboration with zero set up. But you might want your website to have less interactions - 

If you're interested in a basic interface to allow anyone on the internet to chat with your chatbot, you don't even have to go past here. Sphinx.html includes a basic chat interface, and if you write a script that never redirects users to the application, they can talk to your bot all day long. The default usage is to determine if a user is human and/or trustworthy and redirect users to the website at that point.

## Compatibility notes
I'm developing multi-interpreter with Node 7+, but everything I'm using has been standard since 0.12, I think.
Browser compatibility is another story, as I'm using Promises and ES6 classes on the clientside.
In early development, I'm concentrating on webkit + gecko browsers (chrome, opera, firefox).
In the future, polyfill and babel translation for older browsers will be provided.

## Why?

The central principal of this project is simply this: you already own a computer and pay for a network connection, why trade your attention and privacy to a social network or megacorp just to co-operate online with friends and coworkers?

As for the ChatScript server being the end of the interpretation-chain, I'm very optimistic about a computer being able to clue in on what you're trying to do and volunteer its abilities to you.

Machine language is so sensitive to the exact syntax and grammar of its parser that things go very poorly when you make a mistake...

One missing semicolom and the program won't start, did you type `rm -rf` in the wrong directory? Poof! All yours files are gone forever. Computers are typically very unforgiving machines that take a lot of patience to get a feel for, and even engineers make mistakes.
So multi-interpreter paired with a ChatScript personality aims to provide an assisstant that knows about itself - can modify its own configuration, read its own error log, and tries to match your intent with its own capabilities.

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
