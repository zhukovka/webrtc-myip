import * as io from 'socket.io-client';
import { ICECandidateMessage, MessageType, NegotiationMessage, RTCMessage } from "./RTCMessage";

export interface SignalingDelegate {
    handleNewIceCandidateMsg(msg: ICECandidateMessage): void;
    
    handleAnswerMsg(msg: NegotiationMessage): void;
    
    handleOfferMsg(msg: NegotiationMessage): void;
    
    handleNewUser(userId: string): void;
    
    setId(id: string): void;
    
    handleDisconnect(userId?: string): void;
}

class SignalingChannel {
    set _debug(value: boolean) {
        this.__debug = value;
    }
    private id: string;
    private __debug: boolean;
    
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
            socket.on('disconnect', (reason: string) => {
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
                        this.delegate.handleNewIceCandidateMsg(<ICECandidateMessage>msg);
                        this.log("CANDIDATE", msg);
                        break;
                    case MessageType.RTC_ANSWER:
                        this.delegate.handleAnswerMsg(<NegotiationMessage>msg);
                        this.log("RTC_ANSWER", msg);
                        break;
                    case MessageType.RTC_OFFER:
                        this.delegate.handleOfferMsg(<NegotiationMessage>msg);
                        this.log("RTC_OFFER", msg);
                        break;
                }
            });
            socket.on('other', (ids: string[]) => {
                this.log('Other', ids);
                for (const id of ids) {
                    this.delegate.handleNewUser(id);
                }
            });
            socket.on('me', (id: string) => {
                this.id = id;
                this.delegate.setId(id);
            });
            socket.on('user disconnect', (id: string) => {
                this.delegate.handleDisconnect(id);
            });
            socket.on('error', (error: any) => {
                reject(error);
            });
        })
    }
    
    sendMessage(msg: RTCMessage) {
        this.log('Client sending message: ', msg);
        this.socket.emit('message', msg);
    }
    
    disconnect() {
        this.socket.disconnect();
    }
    
    private log(...args: any[]) {
        if (this.__debug) {
            console.log(...args);
        }
    }
}

export default SignalingChannel;
