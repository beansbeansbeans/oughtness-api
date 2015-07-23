var sio = require('socket.io'),
  fs = require('fs'),
  cookie = require('cookie'),
  cookieParser = require('cookie-parser'),
  messagePageCount = 5;

module.exports = Sockets;

function Sockets (app, server, ee) {
  var config = app.get('config');
  var client = app.get('mongoClient');
  var io = sio.listen(server);
  var sessionStore = app.get('sessionStore');
  var getRoomsOnline = function() {
    return client.collection('rooms').find().toArray();
  };
  var updateRoomsOnline = function() {
    getRoomsOnline().then(function(records) {
      io.sockets.in('lobby').emit('rooms update', records);
    });
  };

  ee.on("room created", updateRoomsOnline);
  ee.on("room deleted", updateRoomsOnline);

  var validateRoomExists = function(id, cb) {
    client.collection('rooms').find({key: id}, function(err, records) {
      if(!err && records.length) {
        cb(records[0]);
      }
    });
  };

  io.use(function(socket, next) {

    var handshakeData = socket.request,
      roomIdRegExp = new RegExp(handshakeData.headers.host + '/rooms/(?:([^\/]+?))\/?$', 'g'),
      roomMatch = roomIdRegExp.exec(handshakeData.headers.referer),
      sid = cookie.parse(handshakeData.headers.cookie)['connect.sid'].substring(2).split('.')[0]; // TODO FIGURE OUT WTF (hack to unsign cookie)

    sessionStore.load(sid, function(err, session) {
      if(!handshakeData.prattle) {
        handshakeData.prattle = {};
      }

      if(session.prattle && session.prattle.user) {
        handshakeData.prattle.user = session.prattle.user;
      } else {
        handshakeData.prattle.user = { 
          _id: sid,
          name: "Anonymous" 
        };
      }

      handshakeData.prattle.user.sid = sid;

      handshakeData.prattle.room = roomMatch ? roomMatch[1] : "lobby";

      next();
    });
  });

  io.sockets.on("connection", function(socket) {
    var user = socket.request.prattle.user,
      roomID = socket.request.prattle.room,
      emitUsersOnline = function() {
        client.collection('rooms').findOne({key: roomID})
          .then(function(record) {
            ee.emit("room online update", {
              key: roomID,
              count: record.online.length
            });

            io.sockets.in(roomID).emit('user update', record.online);
          });
      };

    socket.join(roomID);

    if(roomID === "lobby") {
      getRoomsOnline().then(function(records) {
        io.sockets.connected[socket.id].emit('rooms update', records);
      });
    } else {
      client.collection('messages').find({ room: roomID })
        .sort({'$natural': -1})
        .limit(messagePageCount).toArray().then(function(messages) {
        io.sockets.connected[socket.id].emit('seed messages', messages);
      });
  
      validateRoomExists(roomID, function(record) {
        user.joinedAt = Date.now();

        client.collection('rooms').update(
        { key: roomID },
        {
          '$addToSet': { "online": user }
        }).then(emitUsersOnline);
      });
    }

    socket.on('get message history', function(createdAt) {
      client.collection('messages').find({
        'room': roomID,
        'createdAt': {'$lt': createdAt}
      })
      .sort({'$natural': -1})
      .limit(messagePageCount).toArray().then(function(messages) {
        io.sockets.connected[socket.id].emit('message history', messages);
      });
    });

    socket.on('my msg', function(data) {
      client.collection('messages').insert({
        message: data,
        user: user,
        room: roomID,
        createdAt: Date.now()
      }).then(function(record) {
        io.sockets.in(roomID).emit('new msg', record);
      });
    });

    socket.on('change name', function(data) {
      user.name = data;
      client.collection('rooms').update(
        { key: roomID, "online._id": user._id },
        {
          '$set': { "online.$.name": data }
        }).then(emitUsersOnline);
    });

    socket.on('disconnect', function(data) {
      validateRoomExists(roomID, function(record) {
        client.collection('rooms').update(
        { key: roomID },
        {
          '$pull': { "online": { sid: user.sid } }
        }).then(emitUsersOnline);
      });
    });
  });
}
