Multi-interpreter is a prototype of a server that needs no configuration and allows for rapid prototyping of new functionality. It includes a REPL that evaluates input first as javascript, but if that errors out it tries bashscript, but if that errors out then it evaluates input as chatscript. 

In this way, you can start the server in a terminal, but continue executing commands as you normally would. Any functions that exist in the server's global scope are available for use in the terminal. ChatScript provides a natural language understanding fallback that, in the future, might interpret the errors thrown and otherwise guide you through how to use unix programs and the functions loaded into the server.

ChatScript is also capable of making POST requests against the server to take control, so you can write natural language dialogues that take control of unix utilities (think, ask the server to generate a new RSA key, or ask the server to make a gif out of a folder full of jpegs).

Most of the utility exists only in the future...
But basically I'm hooking up natural language understanding and node's http pipes to all the unix utilities.
