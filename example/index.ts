import { JoinMessage, MessageType, TargetMessage } from "../src/RTCMessage";

const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const app = express();

var http = require('http').Server(app);

var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', (req, res) => res.render('pages/index'));

const streamers = {};

io.on('connection', function (socket) {
  // send a private message to the socket with the given id
  const id = socket.id;
  
  // sending to sender-client only
  socket.emit('me', id);
  
  socket.on('disconnecting', (reason) => {
    let rooms = Object.keys(socket.rooms);
    for (const room of Object.values(socket.rooms)) {
      socket.to(room).emit('user disconnect', id);
    }
  });
  
  socket.on('message', (msg: TargetMessage | JoinMessage) => {
    switch (msg.type) {
      case MessageType.RTC_OFFER:
      // offer to next connected user
      // io.to(`${(msg as TargetMessage).target}`).emit('message', msg);
      // break;
      case MessageType.RTC_ANSWER:
        // answer to first user
        io.to(`${msg.target}`).emit('message', msg);
        break;
      
      case MessageType.JOIN:
        const { room, isStreamer } = msg as JoinMessage;
        
        socket.join(room);
        
        // Streamer connected
        if (isStreamer) {
          streamers[room] = id;
          
          // Get list of viewer waiting
          io.in(room).clients((error, clients) => {
            if (error) throw error;
            
            console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
            socket.emit('other', clients.filter(client => client != id));
          });
          
        } else {
          // Viewer connected
          const streamerId = streamers[room];
          console.log('other connected', id);
          // if a streamer is already connected
          if (streamerId) {
            socket.to(`${streamerId}`).emit('other', [id]);
          }
        }
        break;
      case MessageType.CANDIDATE:
        // sending to all clients in the room except sender
        for (const room of Object.values(socket.rooms)) {
          socket.to(room).emit('message', msg);
        }
        break;
      default:
        // sending to all clients except sender
        socket.broadcast.emit('message', msg);
    }
  });
  
});
http.listen(PORT, () => console.log(`Listening on ${PORT}`));
