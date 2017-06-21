I have this dream of writing a web server that walks you through the process of configuring itself for your needs.
Kind of like that cow in the Restaurant at the End of the Universe that recommends its own liver, and rolls its eyes when you ask for a salad.

Operator.js does all the process creation and supervising, so once you git clone, you can run 'node operator'
That starts listening for HTTP requests, but it also listens for input on stdin, so once you start the operator, you can still run bash commands (git status, ls and so on), but I thought since its a javascript process interpreting the input you might as well allow people to run javascript one-liners. I always find myself opening a terminal to run node just to see what some data type coerced to a Boolean returns. This 'interpret' function can be easily modified to integrate the REPL of your choice. Maybe you want to test python in your shell while the server is running, or haskell, see if I care. 


Some notes on the user redirection process: 

localhost:3000 is redirected to guest.localhost:3000, and when guest is used as a subdomain, the request is proxy'd to the node process created just for that subdomain.

In this way (in the near future), node processes can be spawned with a particular user ID on the unix OS underlying the server, allowing unix to handle file and executable permissions.

The way I'm redirecting and proxying to child processes based on a subdomain works fine with any browser if the server is named through a DNS service (ie hosted with a url). If you're connecting to the server via localhost, you can use chrome with no trouble. Other browsers automatically perform DNS lookup on the subdomain.localhost address and of course it doesn't find anything, so to use browsers other than chrome you must edit your system's HOSTS file and resolve each subdomain you want to use on your localhost to the proper address, like so:
```
127.0.0.1 localhost
127.0.0.1 guest.localhost
127.0.0.1 somethingelse.localhost
```
Copyright Colten Jackson 2017

License is UIUC/NCSA: Do the thing!