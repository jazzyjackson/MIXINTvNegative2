/*
Bookkeeper keeps busy, intercepting all proxy'd streamed, it does a few things for every chunk of data: 
- record current memory and cpu usage of associated process
- sum bandwidth up, each chunk will have a length proerty, sum sum sum until end, then record the data transfer
- on PUT, intercept the x-commmit-message header, the PUT socket isn't closed until the file is closed, so you should be able to watch for the end event, and then git commit.
*/