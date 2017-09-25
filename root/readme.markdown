# Poly-Int
### Polymorphic Interpreter

### An extensible and remixable space for cooperating with your network.

Cooperating may include:
- Uploading and modifying media on a shared, versioned filesystem
- Communicating in chatrooms of your own design
- Building applications and artwork for yourself and others

Your network may include:
- close friends and family
- your local wifi router
- distant acquiantences 
- transoceanic fiber optics
- strangers with a common interest
- low-cost cloud infrastructure
- coworkers and business partners
- physical computers you control

When you start Poly-Int on your machine, you're given a link that makes it accessible to anyone on the same network. If you're hosted in the cloud, or have an ISP that allows incoming connections on ports 80 and 443, the whole world is the same network. Otherwise, participants in the same room can use this shared online space with or without any connection to the wider internet.

A configuration graph (figtree for short) describes the layout of a workspace, which arranges HTML custom elements in the window and describes the attributes for each element. One attribute might be a source to pull content from (img, link, audio, and video tags make use of this already to load media, custom elements may be programmed to accept any filetype) - so the content of a workspace is kept separate from the presentation layer (layout, style, and interactivity via HTML, CSS, and JS). This figtree can exist as a file kept for different participants and projects, or it can be passed into the URL as a query string, producing your requested layout and content without having to keep the file on the server.

