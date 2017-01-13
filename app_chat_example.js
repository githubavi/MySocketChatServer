// Setup basic express server
var express = require('express');
var app = express();
var appserver = require('http').createServer(app); //app server

var io = require('socket.io')({ transports: ['websocket'] });
io.attach(appserver);

//var io = require('socket.io')(appserver, { transports: ['websocket'] }); //NOT WORKING GIVING SERVER 400 ERROR
//var io = require('socket.io')(server); WORKING


var redis = require("redis");

// Add your cache name and access key.
//var pub = require('redis').createClient(6379, 'redcache.redis.cache.windows.net', { auth_pass: 'YOu45Tu1JDj1iTk6r3MISHRsd0ixff06M0GzEVjvxRQ=', return_buffers: true }); //unsecure,  working
//var sub = require('redis').createClient(6379, 'redcache.redis.cache.windows.net', { auth_pass: 'YOu45Tu1JDj1iTk6r3MISHRsd0ixff06M0GzEVjvxRQ=', return_buffers: true }); //unsecure,  working


var pub = redis.createClient(6380, 'redcache.redis.cache.windows.net', { auth_pass: 'YOu45Tu1JDj1iTk6r3MISHRsd0ixff06M0GzEVjvxRQ=', return_buffers: true, tls: { servername: 'redcache.redis.cache.windows.net' } }); //secure, working
var sub = redis.createClient(6380, 'redcache.redis.cache.windows.net', { auth_pass: 'YOu45Tu1JDj1iTk6r3MISHRsd0ixff06M0GzEVjvxRQ=', return_buffers: true, tls: { servername: 'redcache.redis.cache.windows.net' } }); //secure, working

var redisadapter = require('socket.io-redis');
io.adapter(redisadapter({ pubClient: pub, subClient: sub }));


var port = process.env.PORT || 3000;

appserver.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  console.log('connected to my socket..');
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
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

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
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
