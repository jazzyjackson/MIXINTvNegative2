//after checking out garbage collection utilities built into node, and reading up on how to analyze your memory metrics and decide what part of your program is leaking... I decided if at all possible it would be very nice to track memory usage per operation, per user. So spawning a child process to handle every little thing is actually great for analyzing your server history - memory usage can be logged and diffed every step of the way! 
//of course, on the low end, a child process to handle some simple addition is going to be memory overkill, maybe 8MB for a moment. But these are transient, short lived. Some noise on the low end. But for any computationally-intensive operation, it will be obvious when memory usage ramped up, when at what exact moment the CPU was pegged.