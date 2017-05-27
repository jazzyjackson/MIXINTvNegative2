Notes on the config & bundle strategy

the dependencies for rendering will be arrays of promises that may or may not be resolved.
per web request, if the files have been read before, then the strings will be resolved right away. 
otherwise, on file change, the promiseholders will be replaced with fresh ones, which will take a moment to resolve
the idea is to Bundle in memory. Instead of creating files every time the page loads, files are read into memory whenever they change.