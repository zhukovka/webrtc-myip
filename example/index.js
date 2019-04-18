"use strict";
exports.__esModule = true;
var RTCMessage_1 = require("../src/RTCMessage");
var express = require('express');
var path = require('path');
var PORT = process.env.PORT || 5000;
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs');
app.get('/', function (req, res) { return res.render('pages/index'); });
var streamers = {};
io.on('connection', function (socket) {
    // send a private message to the socket with the given id
    var id = socket.id;
    // sending to sender-client only
    socket.emit('me', id);
    socket.on('disconnecting', function (reason) {
        var rooms = Object.keys(socket.rooms);
        for (var _i = 0, _a = Object.values(socket.rooms); _i < _a.length; _i++) {
            var room = _a[_i];
            socket.to(room).emit('user disconnect', id);
        }
    });
    socket.on('message', function (msg) {
        switch (msg.type) {
            case RTCMessage_1.MessageType.RTC_OFFER:
            // offer to next connected user
            // io.to(`${(msg as TargetMessage).target}`).emit('message', msg);
            // break;
            case RTCMessage_1.MessageType.RTC_ANSWER:
                // answer to first user
                io.to("" + msg.target).emit('message', msg);
                break;
            case RTCMessage_1.MessageType.JOIN:
                var _a = msg, room = _a.room, isStreamer = _a.isStreamer;
                socket.join(room);
                // Streamer connected
                if (isStreamer) {
                    streamers[room] = streamers[room] || [];
                    streamers[room].push(id);
                    // Get list of viewers waiting
                    io["in"](room).clients(function (error, clients) {
                        if (error)
                            throw error;
                        console.log('clients', clients); // => [Anw2LatarvGVVXEIAAAD]
                        socket.emit('other', clients.filter(function (client) { return client != id; }));
                    });
                }
                else {
                    // Viewer connected
                    var streamerIds = streamers[room];
                    console.log('other connected', id);
                    // if a streamer is already connected
                    for (var _i = 0, streamerIds_1 = streamerIds; _i < streamerIds_1.length; _i++) {
                        var streamerId = streamerIds_1[_i];
                        socket.to("" + streamerId).emit('other', [id]);
                    }
                }
                break;
            case RTCMessage_1.MessageType.CANDIDATE:
                // sending to all clients in the room except sender
                for (var _b = 0, _c = Object.values(socket.rooms); _b < _c.length; _b++) {
                    var room_1 = _c[_b];
                    socket.to(room_1).emit('message', msg);
                }
                break;
            default:
                // sending to all clients except sender
                socket.broadcast.emit('message', msg);
        }
    });
});
http.listen(PORT, function () { return console.log("Listening on " + PORT); });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdEQUE0RTtBQUc1RSxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztBQUN0QyxJQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztBQUV0QixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBRXZDLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVwQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNsRCxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzNDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFL0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBQyxHQUFRLEVBQUUsR0FBUSxJQUFLLE9BQUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO0FBRWhFLElBQU0sU0FBUyxHQUFpQyxFQUFFLENBQUM7QUFFbkQsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxNQUFjO0lBQ3hDLHlEQUF5RDtJQUN6RCxJQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBRXJCLGdDQUFnQztJ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