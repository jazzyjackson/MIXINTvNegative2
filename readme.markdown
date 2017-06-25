# multi-interpreter

I have this dream of writing a web server that walks you through the process of configuring itself for your needs.
Kind of like that cow in the Restaurant at the End of the Universe that recommends its own liver, and rolls its eyes when you ask for a salad.

The first step is to build a platform that can do all the work of your typical webserver, but has the power to change its own configuration and read its own error messages.

But before trying to explain what a self-aware web server looks like, I want to provide a minimal configuration that is useful right away.

Multi-intrepreter aims to make it easy to do all the things computers are good at, from highest priority:
- Sharing files on a local network, or uploading files to a server to share online
- Message passing between friends and co-workers
- Modify the user interface to access and edit messages, files, and programs
- Scheduling assistance to set alarms and run programs
- Explain what programs do and offer you many options on how to run them
- Archiving files, keeping records and notes and tracking changes to them all

# The Sphinx, the Bookkeeper, and the Operator

**Sphinx.html blocks your passage until you answer a riddle.**
It gets returned to any request made without authorization. ChatScript is used to ask a security question, or a riddle, or even a series of questions to decide if a visitor is trustworthy (or you!), and then returns a cookie identifying you to the Operator, who spins up a node server just for you called switchboard.js. This subprocess is started with a unix user-id attached, allowing for granular control of file and executable permissions. This means you can let the public at large read files to access your web page, but maybe you don't let them write messages to disk unless they answered the question a certain way. This also allows you to write web interfaces to any program - to write to databases or deploy spiders or send an SMS message - that are only allowed to be executed when requested by a user with appropriate permissions. The server still fulfills the request, but if Switchboard doesn't have permission, the write/execute process will throw an error, and the error will be passed back to the client. However, this also means Windows computers don't get the security benefits, as they don't implement *nixy owner-group-other read-write-execute permissions. So running multi-interpreter on a Windows machine is a bit of a free for all, and I can only encourage it on a local network with people you trust.

**Bookkeeper.js takes note of every transaction made by the Operator.**
Each user gets a separate log file, including the system itself. System errors are kept in error.log. They are written in JSON for easy interpretation by other programs. Each log includes information about GET/POST/PUT/DELETE request made by that user, how many bytes of data were transfered, along with CPU and RAM usage by that users' Switchboard.

**Operator.js connects your calls.**
It is the top level script that does all the process creation and supervising, so once you git clone, you can run 'node operator' to start listening for HTTP requests. It also listens for input on stdin, so once you start the operator, you can still use the shell. Input is piped to the interpret function, explained further down, allowing you to run bash commands, javascript one-liners, or plain English to be replied to by the system's ChatScript personality.


# Logs, Branches, and Spiders
You can think of logs as slices of a branch, an artifact that lets analyze the rings to determine what happened over time. Thankfully for our computer program, we don't have to destroy the tree to read its logs.

If you're familiar with git branches, you'll have to zoom out a bit - a repository may have many branches, but it will at least have a master branch, which implies that there is a larger tree to attach to. The host machine's filesystem is that tree that contains many repos and their master branches.

Spiders are programs that crawl filesystems and computer networks and carry out some task for you. Basic spiders might include, download any new messages from a POP server, fetch the weather.
They can be accessed via POST requests from client side applications or by a ChatScript server, allowing your chatbot to digest data from the wider internet.

# Convologs, Figtrees, Interpret, Switchboard, and GUI
Convologs are JSON files with a single message per line, one file for each user.
This allows the recording and interweaving of messages from many users, so anyone with a working directory 
Figtrees, short for Configuration Trees, are directed graphs representing the state of a workspace associated with a particular user. The file is read by a client to initialize and position all the blocks a particular user was working on.

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

## License
License is UIUC/NCSA: Do the thing! No restriction on commercial use, no warranty.

Copyright (c) 2017 Colten Jackson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
Neither my name nor the names of multi-interpreter's contributors may be used to endorse or promote products derived from this Software without specific prior written permission.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.
