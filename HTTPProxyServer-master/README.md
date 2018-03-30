# HTTPProxyServer
A basic HTTP proxy server (2 versions - JAVA and NODEJS)to handle HTTTP GET and POST request. Also Implemented LRU Caching in both the versions.

Java Server uses Socket Connections to handle requests and forward them to the target host.

Node Server uses Node HTTP module for the above task. 

Caching in Java Server is implemented with HashMaps and LinkLists.
In Node Server, NPM LRU cache module is used https://www.npmjs.com/package/lru-cache

