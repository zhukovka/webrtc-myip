import * as io from 'socket.io-client';
import { MessageType, RTCMessage } from "./RTCMessage";

export interface SignalingDelegate {
  handleNewIceCandidateMsg(msg);
  
  handleAnswerMsg(msg);
  
  handleOfferMsg(msg);
  
  handleNewUser(userId: string);
  
  setId(id: string);
  
  handleDisconnect(userId?: string);
}

class SignalingChannel {
  private id: string;
  
  constructor(private wsURL: string) {
  
  }
  
  private socket: SocketIOClient.Socket;
  delegate: SignalingDelegate;
  
  setupSocket() {
    const socket = io(this.wsURL);
    this.socket = socket;
    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        resolve();
      });
      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, you need to reconnect manually
          socket.connect();
        }
        // else the socket will automatically try to reconnect
        //TODO: handle reconnection
        this.delegate.handleDisconnect(this.id);
      });
      socket.on('message', (msg: RTCMessage) => {
        switch (msg.type) {
          case MessageType.CANDIDATE:
            this.delegate.handleNewIceCandidateMsg(msg);
            break;
          case MessageType.RTC_ANSWER:
            this.delegate.handleAnswerMsg(msg);
            break;
          case MessageType.RTC_OFFER:
            this.delegate.handleOfferMsg(msg);
            break;
        }
      });
      socket.on('other', (ids: string[]) => {
        console.log('Other', ids);
        for (const id of ids) {
          this.delegate.handleNewUser(id);
        }
      });
      socket.on('me', id => {
        this.id = id;
        this.delegate.setId(id);
      });
      socket.on('user disconnect', (id) => {
        this.delegate.handleDisconnect(id);
      })
    })
  }
  
  sendMessage(msg) {
    console.log('Client sending message: ', msg);
    this.socket.emit('message', msg);
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

export default SignalingChannel;
