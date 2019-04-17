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
                    streamers[room] = id;
                    // Get list of viewer waiting
                    io["in"](room).clients(function (error, clients) {
                        if (error)
                            throw error;
                        console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
                        socket.emit('other', clients.filter(function (client) { return client != id; }));
                    });
                }
                else {
                    // Viewer connected
                    var streamerId = streamers[room];
                    console.log('other connected', id);
                    // if a streamer is already connected
                    if (streamerId) {
                        socket.to("" + streamerId).emit('other', [id]);
                    }
                }
                break;
            case RTCMessage_1.MessageType.CANDIDATE:
                // sending to all clients in the room except sender
                for (var _i = 0, _b = Object.values(socket.rooms); _i < _b.length; _i++) {
                    var room_1 = _b[_i];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdEQUE0RTtBQUU1RSxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztBQUN0QyxJQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztBQUV0QixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBRXZDLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVwQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUNwRCxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzNDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFN0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBQyxHQUFHLEVBQUUsR0FBRyxJQUFLLE9BQUEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxDQUFDO0FBRXRELElBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUVyQixFQUFFLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFVLE1BQU07SUFDbEMseURBQXlEO0lBQ3pELElBQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFFckIsZ0NBQWdDO0lB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