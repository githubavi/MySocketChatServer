// Setup basic express server
var express = require('express');
var app = express();
var appserver = require('http').createServer(app); //app server

var io = require('socket.io')({ transports: ['websocket'] });
io.attach(appserver);

var redis = require("redis");


var pub = redis.createClient(6380, 'redcache.redis.cache.windows.net', { auth_pass: 'cIyuacHkOptvo8bf7AFYHpDdStIP6xMpsr8ODSb3J0E=', return_buffers: true, tls: { servername: 'redcache.redis.cache.windows.net' } }); //secure, working
var sub = redis.createClient(6380, 'redcache.redis.cache.windows.net', { auth_pass: 'cIyuacHkOptvo8bf7AFYHpDdStIP6xMpsr8ODSb3J0E=', return_buffers: true, tls: { servername: 'redcache.redis.cache.windows.net' } }); //secure, working

var redisadapter = require('socket.io-redis');
io.adapter(redisadapter({ pubClient: pub, subClient: sub }));

//app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 3000;

appserver.listen(port, function () {
    var addr = appserver.address();
    console.log('Server listening on http://' + addr.address + ':' + addr.port);
});


// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;
    console.log('connected to my socket..');

    // when the client emits 'new message', this listens and executes
    socket.on('newmessage', function (data) {
        // we tell the client to execute 'new message'
        //socket.broadcast.emit('messagecallback', {
        //    username: socket.username,
        //    message: data
        //});

        io.emit('messagecallback', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});
