var http = require('http');
var url = require('url');
var path = require('path');
var queryString = require('querystring');
var lru = require('lru-cache');

//Options for use
var options = {
    local_port: 8080,
    server: 'www.anujthula.com',
    port: 80,
    max_requests: 5,
    cache_size: 50,
    freshness: 100000
};

var LRUOptions = {
    max: options['cache_size'],
    length: function (n, key) {
        return n * 2 + key.length
    },
    maxAge: 200000
};

var cache = lru(LRUOptions);

//console.log(options['server']);

function getContentType(headers) {


    return headers.split(';')[0] || 'application/octet-stream';
}


function getErrorResponse(response, message, errorCode) {
    response.writeHead(errorCode);
    response.write(message);
    response.end();

    return response;
}

function cookieSetter(response, cookie) {

    var count = parseInt(cookie.count);
    var timestamp = parseInt(cookie.timestamp);
    // console.log('cookie time - ' + timestamp);
    response.setHeader('Set-Cookie', ['count=' + (count + 1).toString(), 'timestamp=' + cookie.timestamp]);
    return response;
}

function getParsedCookies(request) {

    var cookies = {};
    var requestCookies = request.headers.cookie;

    if (requestCookies) {
        requestCookies.split(';').forEach(function (cookie) {
            var chunk = cookie.split('=');
            cookies[chunk.shift().trim()] = decodeURI(chunk.join('='));
        });
    }

    return cookies;
}


http.createServer(function (client_req, client_res) {

    var requestOptions = {
        hostname: options['server'],
        port: options['port'],
        path: client_req.url,
        method: client_req.method
    };

    var urlObj = url.parse(client_req.url, true);
    console.log(urlObj.pathname);
    var q = urlObj.query;
    console.log(q.key);
    console.log(client_req.url);
    var contentType = path.extname(urlObj.pathname);
    if (contentType === '') {
        contentType = '.html';
    }
    // console.log(contentType);

    //requestOptions['headers'] = client_req.headers;

    var maxRequests = options['max_requests'];
    var allow = true;

    //cookie handling
    var decodedCookie = getParsedCookies(client_req);
    console.log(decodedCookie);
    if (!decodedCookie.count) {
        // console.log(parseInt(decodedCookie.timeleft));
        var currentDate = new Date();
        //console.log(currentDate.getTime());
        client_res.setHeader('Set-Cookie', ['count=1', 'timestamp=' + currentDate.getTime().toString()]);
    } else {

        var currentDate = new Date();
        var difference = currentDate - parseInt(decodedCookie.timestamp);
        // console.log('diff - ' + difference);
        // console.log('1 - ' + currentDate.getTime());
        // console.log('2 - ' + decodedCookie.timestamp);
        if (decodedCookie.count >= maxRequests && difference < 120000) {
            console.log('in allow false');
            allow = false;
        } else if (difference >= 120000) {
            console.log('in allow true');
            allow = true;
            decodedCookie.count = '0';
            decodedCookie.timestamp = currentDate.getTime().toString();
        }
        cookieSetter(client_res, decodedCookie);
    }

    if (allow) {

        //GET handling
        if (client_req.method === 'GET' && !urlObj.pathname.startsWith('/admin')) {
            console.log('in get');

            if (cache.has(urlObj.pathname)) {

                console.log("from cache");
                var lruBuffer = '';
                lruBuffer = cache.get(urlObj.pathname);

                client_res.setHeader("Content-Type", getContentType(contentType));
                client_res.writeHead(200);
                client_res.end(lruBuffer);


            }
            else {

                console.log('not cache');
                var proxy = http.request(requestOptions, function (res) {

                    var s = '';
                    var x = '';
                    var headarr = (res.headers['content-type']).toString();
                    console.log(res.statusCode);
                    if (res.statusCode === 200) {

                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            s += chunk;
                        });
                        res.on('end', function () {
                            client_res.setHeader("Content-Type", getContentType(headarr));
                            // client_res.setHeader('Set-Cookie', ['count=1' , 'timeleft=10'] );
                            client_res.writeHead(res.statusCode);
                            client_res.end(s);
                            cache.set(urlObj.pathname, s);
                        })


                    }
                    //Redirect Handling
                    else if (res.statusCode < 400 && res.statusCode >= 300) {

                        console.log(res.headers.location);
                        var http_sCheck = url.parse(res.headers.location);
                        console.log(http_sCheck.protocol);
                        if (http_sCheck.protocol === 'http:') {

                            console.log('yes');
                            requestOptions['path'] = http_sCheck.pathname;
                            var redirect = http.request(requestOptions, function (redirectResponse) {
                                redirectResponse.setEncoding('utf8');
                                var headarr = (redirectResponse.headers['content-type']).toString();
                                redirectResponse.on('data', function (chunk) {
                                    x += chunk;
                                });

                                redirectResponse.on('end', function () {
                                    console.log("Start  redirect response - " + redirectResponse.statusCode);
                                    if (redirectResponse.statusCode === 200) {
                                        client_res.setHeader("Content-Type", getContentType(headarr));
                                        client_res.writeHead(redirectResponse.statusCode);
                                        client_res.end(x);
                                        cache.set(urlObj.pathname, x);

                                    } else {
                                        getErrorResponse(client_res, getErrorMessage(redirectResponse.statusCode) + ' - Again Redirected - ' + redirectResponse.headers.location, redirectResponse.statusCode)
                                    }
                                })
                            });

                            redirect.end();

                        }
                        //If redirect to https
                        else {
                            var redir = res.headers.location;
                            getErrorResponse(client_res, getErrorMessage(res.statusCode) + ' - https target denied - ' + redir, res.statusCode)
                        }
                    }
                    else {
                        getErrorResponse(client_res, getErrorMessage(res.statusCode), res.statusCode)
                    }


                });

                proxy.on('error', function (err) {
                    console.log("error - " + err.message);
                });

                proxy.end();

            }

        }//END OF CACHE Condition

        //POST Handling
        else if (client_req.method === 'POST' && !urlObj.pathname.startsWith('/admin')) {

            console.log('in post');

            if (cache.has(urlObj.pathname)) {

                console.log("from cache");
                var lruBuffer = '';
                lruBuffer = cache.get(urlObj.pathname);

                client_res.setHeader("Content-Type", getContentType(contentType));
                client_res.writeHead(200);
                client_res.end(lruBuffer);


            }
            else {


                var payload = '';
                var body = '';
                client_req.on('data', function (data) {
                    //console.log(data);
                    body += data;
                });
                client_req.on('end', function () {
                    payload = queryString.parse(body);
                    console.log(payload);
                });
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
                requestOptions['headers'] = headers;


                var proxy = http.request(requestOptions, function (res) {
                    //HANDLE RESPONSE

                    var s = '';
                    var x = '';
                    var headarr = (res.headers['content-type']).toString();

                    if (res.statusCode === 200) {

                        res.setEncoding('utf8');
                        res.on('data', function (chunk) {
                            s += chunk;
                        });
                        res.on('end', function () {
                            client_res.setHeader("Content-Type", getContentType(headarr));
                            client_res.writeHead(res.statusCode);
                            client_res.end(s);
                            cache.set(urlObj.pathname, s);
                        })


                    }
                    //Redirect Handling
                    else if (res.statusCode < 400 && res.statusCode >= 300) {

                        console.log('red - ' + res.headers.location);
                        var http_sCheck = url.parse(res.headers.location);
                        console.log('protocol - ' + http_sCheck.protocol);
                        if (http_sCheck.protocol === 'http:' || http_sCheck.protocol === null) {

                            console.log('yes');
                            requestOptions['path'] = http_sCheck.pathname;
                            var redirect = http.request(requestOptions, function (redirectResponse) {
                                redirectResponse.setEncoding('utf8');
                                var headarr = (redirectResponse.headers['content-type']).toString();
                                redirectResponse.on('data', function (chunk) {
                                    x += chunk;
                                });

                                redirectResponse.on('end', function () {
                                    console.log("Start  redirect response - " + redirectResponse.statusCode);
                                    if (redirectResponse.statusCode === 200) {
                                        client_res.setHeader("Content-Type", getContentType(headarr));
                                        client_res.writeHead(redirectResponse.statusCode);
                                        client_res.end(x);
                                        cache.set(urlObj.pathname, x);

                                    } else {
                                        getErrorResponse(client_res, getErrorMessage(redirectResponse.statusCode) + ' - Again Redirected - ' + redirectResponse.headers.location, redirectResponse.statusCode)
                                    }
                                })
                            });

                            redirect.end();

                        }
                        //If redirect to https
                        else {
                            var redir = res.headers.location;
                            getErrorResponse(client_res, getErrorMessage(res.statusCode) + ' - https target denied - ' + redir, res.statusCode)
                        }
                    }
                    else {
                        getErrorResponse(client_res, getErrorMessage(res.statusCode), res.statusCode)
                    }


                });

                //For POST payload.
                proxy.write(payload);


                proxy.on('error', function (err) {
                    console.log("error - " + err.message);
                });

                proxy.end();


            }
        }
        //Cache Requests
        else if (urlObj.pathname.startsWith('/admin')) {

            if (q.key !== undefined && q.value !== undefined)
                cacheRequestHandler(client_res, client_req.method, q.key, q.value);
            else if (q.key !== undefined)
                cacheRequestHandler(client_res, client_req.method, q.key);
            else
                cacheRequestHandler(client_res, client_req.method);
        }

        //If not GET OR POST
        else {
            getErrorResponse(client_res, getErrorMessage(501), 501);
        }
    }
    else {
        getErrorResponse(client_res, getErrorMessage(429), 429);
    }
}).listen(options['local_port'], function () {
    console.log("Started");
});


function getErrorMessage(errorCode) {

    var errorMessage = {
        511: 'Network Authentication Required',
        510: 'Not Extended',
        508: 'Loop Detected',
        507: 'Insufficient Storage',
        506: 'Variant Also Negotiates',
        505: 'HTTP Version Not Supported',
        504: 'Gateway Timeout',
        503: 'Service Unavailable',
        502: 'Bad Gateway',
        501: 'The request method is not supported by the server and cannot be handled. The only method that server is required to support (and therefore that must not return this code) are GET',
        500: 'Internal Server Error',
        451: 'Unavailable For Legal Reasons',
        431: 'Request Header Fields Too Large',
        429: 'Too Many Requests',
        428: 'Precondition Required',
        426: 'Upgrade Required',
        424: 'Failed Dependency',
        423: 'Locked',
        422: 'Unprocessable Entity',
        421: 'Misdirected Request',
        418: 'Im a teapot',
        417: 'Expectation Failed',
        416: 'Requested Range Not Satisfiable',
        415: 'Unsupported Media Type',
        414: 'URI Too Long',
        413: 'Payload Too Large',
        412: 'Precondition Failed',
        411: 'Length Required',
        410: 'Gone',
        409: 'Conflict',
        408: 'Request Timeout',
        407: 'Proxy Authentication Required',
        406: 'Not Acceptable',
        405: 'Method Not Allowed',
        404: 'Not Found',
        403: 'Forbidden',
        401: 'Unauthorized',
        400: 'Bad Request',
        308: 'Permanent Redirect',
        307: 'Temporary Redirect',
        306: 'unused',
        304: 'Not Modified',
        303: 'See Other',
        302: 'Found',
        301: 'Moved Permanently',
        300: 'Multiple Choice'


    };
    return errorMessage[errorCode];
}

setInterval(function () {
    // console.log('in prune');
    // console.log(cache.itemCount);
    cache.prune();
    // console.log(cache.itemCount);
}, options['freshness']);

function cacheRequestHandler(response, methodname, key, value) {
    var dataFromCache = '';

    switch (methodname) {
        case 'POST':
            cache.reset();
            dataFromCache = "cache resetted";
            response.writeHead(200);
            response.write(dataFromCache);
            response.end();
            break;
        case 'DELETE':
            if (cache.has(key)) {
                dataFromCache = 'Given key deleted from cache';
                response.writeHead(200);
                response.write(dataFromCache);
                response.end();
            }
            else {
                dataFromCache = 'Given key not in  cache';
                response.writeHead(404);
                response.write(dataFromCache);
                response.end();
            }
            break;
        case 'GET':
            if (cache.has(key)) {
                dataFromCache = cache.get(key);
                response.writeHead(200);
                response.write(dataFromCache);
                response.end();
            }

            else {
                dataFromCache = 'Given key not in  cache';
                response.writeHead(404);
                response.write(dataFromCache);
                response.end();
            }

            break;
        case 'PUT':
            cache.set(key, value);
            dataFromCache = 'Given key value pair set in  cache';
            response.writeHead(200);
            response.write(dataFromCache);
            response.end();
            break;
        default:
            dataFromCache = methodname + ' Not Allowed';
            response.writeHead(501);
            response.write(dataFromCache);
            response.end();

    }

    return response;
}
