import { ICECandidateMessage, MediaType, MessageType, NegotiationMessage } from "./RTCMessage";
import SignalingChannel, { SignalingDelegate } from "./SignalingChannel";
import adapter from 'webrtc-adapter';
import * as EventEmitter from "eventemitter3";

if (!adapter) {

}

export enum STATE_EVENTS {
  CONNECTED = 'state-events/connected',
  DISCONNECTED = 'state-events/disconnected',
  FAILED = 'playback-events/failed',
  CLOSED = 'playback-events/closed',
}

export enum CLIENT_EVENTS {
  COUNT_CHANGED = 'client-events/count-changed',
}

//TODO: Warning! This servers are borrowed without permission!
const config = {
  // 'iceServers': [
  //   {
  //     "urls": [
  //       "stun:64.233.165.127:19302",
  //       "stun:[2a00:1450:4010:c08::7f]:19302"
  //     ]
  //   },
  //   {
  //     "urls": [
  //       "turn:64.233.161.127:19305?transport=udp",
  //       "turn:[2a00:1450:4010:c01::7f]:19305?transport=udp",
  //       "turn:64.233.161.127:19305?transport=tcp",
  //       "turn:[2a00:1450:4010:c01::7f]:19305?transport=tcp"
  //     ],
  //     "username": "CNKsvOUFEgb5DoznbPYYzc/s6OMTIICjBQ",
  //     "credential": "hzb6Xi+YesoW1SZ6P70bo2OOWzk="
  //   }
  // ]
  
  // 'iceServers': [
  //   {
  //     "urls": [
  //       "stun:188.166.60.25:3478"
  //     ]
  //   },
  //   {
  //     "urls": [
  //       "turn:188.166.60.25:3478"
  //     ],
  //     "username": "kurento",
  //     "credential": "kurentopw"
  //   }
  // ]
  "iceServers": [{ "urls": ["stun:64.233.161.127:19302", "stun:[2a00:1450:4010:c01::7f]:19302"] }, {
    "urls": ["turn:64.233.161.127:19305?transport=udp",
      "turn:[2a00:1450:4010:c01::7f]:19305?transport=udp",
      "turn:64.233.161.127:19305?transport=tcp",
      "turn:[2a00:1450:4010:c01::7f]:19305?transport=tcp"],
    "username": "CJX8yOUFEgb7amoM5/0Yzc/s6OMTIICjBQ",
    "credential": "55xsQhA4gKlqfpU7DIfcUyDGEHA=",
    "maxRateKbps": "8000"
  }]
};

interface RtcPeerConnections {
  [key: string]: RTCPeerConnection;
}

interface PeerConnections {
  [key: string]: RtcPeerConnections;
}

interface SourceStream {
  userMedia?: MediaStream;
  displayMedia?: MediaStream;
}

interface StreamDestination {
  userMedia?: HTMLElement;
  displayMedia?: HTMLElement;
}

interface ConnectionEmiter {
  userMedia?: EventEmitter<string | symbol>;
  displayMedia?: EventEmitter<string | symbol>;
}

class RTC implements SignalingDelegate {
  private mediaConstraints = {
    audio: true,            // We want an audio track
    video: true             // ...and we want a video track
  };
  
  private sourceStream: SourceStream = {};
  private destStream: SourceStream = {};
  private id: string;
  private signaling: SignalingChannel;
  private readonly peerConnections: PeerConnections;
  private streamDestination: StreamDestination = {};
  private emiters: ConnectionEmiter = {};
  private eventEmitter: EventEmitter<string | symbol>;
  private connectionsCount: number;
  
  constructor(wsURL: string) {
    this.peerConnections = {
      userMedia: {},
      displayMedia: {}
    };
    this.signaling = new SignalingChannel(wsURL);
    this.signaling.delegate = this;
    this.connectionsCount = 0;
    this.eventEmitter = new EventEmitter();
  }
  
  async getMedia() {
    return navigator.mediaDevices.getUserMedia(this.mediaConstraints);
  }
  
  async getDisplay(): Promise<MediaStream> {
    // @ts-ignore
    return navigator.mediaDevices.getDisplayMedia({ video: true });
  }
  
  createPeerConnection(mediaType: MediaType) {
    try {
      const pc = new RTCPeerConnection(config);
      // Handles |icecandidate| events by forwarding the specified
      // ICE candidate (created by our local ICE agent) to the other
      // peer through the signaling server.
      pc.onicecandidate = (event) => {
        console.log('sending ICE candidate', event);
        return this.handleCandidate(event.candidate, mediaType);
      };
      // Called by the WebRTC layer when events occur on the media tracks
      // on our WebRTC call. This includes when streams are added to and
      // removed from the call.
      //
      // track events include the following fields:
      //
      // RTCRtpReceiver       receiver
      // MediaStreamTrack     track
      // MediaStream[]        streams
      // RTCRtpTransceiver    transceiver
      pc.ontrack = (event) => {
        console.log('Track event:', event);
        this.handleSourceTrack(event.track, mediaType);
      };
      pc.onconnectionstatechange = (event) => {
        this.handleConnectionStateChangeEvent(event, mediaType);
      };
      pc.onsignalingstatechange = (event) => {
        this.handleConnectionStateChangeEvent(event, mediaType);
      };
      pc.ondatachannel = (...args) => console.log('ondatachannel', args);
      pc.onnegotiationneeded = (...args) => console.log('onnegotiationneeded', args);
      console.log('Created RTCPeerConnnection');
      return pc;
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      return;
    }
  }
  
  addTracksToPC(peerConnection: RTCPeerConnection, stream: MediaStream) {
    if (!stream) {
      return;
    }
    for (const track of stream.getTracks()) {
      peerConnection.addTrack(track)
    }
  }
  
  removeTracksFromPC(peerConnection: RTCPeerConnection) {
    for (const sender of peerConnection.getSenders()) {
      peerConnection.removeTrack(sender);
    }
  }
  
  getOrCreatePeerConnection(mediaType: MediaType, userId: string): RTCPeerConnection {
    const pc = this.peerConnections[mediaType][userId] || this.createPeerConnection(mediaType);
    this.peerConnections[mediaType][userId] = pc;
    return pc;
  }
  
  // Called by the WebRTC layer to let us know when it's time to
  // begin (or restart) ICE negotiation. Starts by creating a WebRTC
  // offer, then sets it as the description of our local media
  // (which configures our local media stream), then sends the
  // description to the callee as an offer. This is a proposed media
  // format, codec, resolution, etc.
  async createOffer(mediaType: MediaType, userId: string) {
    if (!userId) {
      throw new Error('No User ID.')
    }
    console.log(`createOffer to ${userId} from ${this.id}`);
    try {
      //1.Create an SDP offer by calling RTCPeerConnection.createOffer()
      const pc = this.getOrCreatePeerConnection(mediaType, userId);
      this.removeTracksFromPC(pc);
      this.addTracksToPC(pc, this.sourceStream[mediaType]);
      
      const offer: RTCSessionDescriptionInit = await pc.createOffer();
      //2. Promise fulfilled: set the description of Caller’s end of the call by calling RTCPeerConnection.setLocalDescription()
      await pc.setLocalDescription(offer);
      //3. Promise fulfilled: send the offer through the signaling server to Callee in a message of type "rtc-offer"
      const msg: NegotiationMessage = {
        mediaType,
        from: this.id,
        type: MessageType.RTC_OFFER,
        sdp: pc.localDescription,
        target: userId
      };
      this.signaling.sendMessage(msg);
    } catch (e) {
      console.error(e);
    }
  }
  
  // Accept an offer to video chat. We configure our local settings,
  // create our RTCPeerConnection, get and attach our local camera
  // stream, then create and send an answer to the caller.
  async handleOfferMsg(msg: NegotiationMessage) {
    const { mediaType, sdp, from } = msg;
    console.log(`GOT OFFER from ${from} to ${this.id}`);
    try {
      // 1. Create an RTCPeerConnection
      const pc = this.getOrCreatePeerConnection(mediaType, from);
      this.removeTracksFromPC(pc);
      this.destStream[mediaType] = null;
      // 2. Create an RTCSessionDescription using the received SDP offer
      const desc = new RTCSessionDescription(sdp);
      // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
      await pc.setRemoteDescription(desc);
      // 6. Promise fulfilled: call RTCPeerConnection.createAnswer() to create an SDP answer to send to Caller
      const answer = await pc.createAnswer();
      // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
      await pc.setLocalDescription(answer);
      console.log("CREATED ANSWER", answer);
      // 8. Promise fulfilled: send the SDP answer through the signaling server to Caller in a message of type “rtc-answer”
      // We've configured our end of the call now. Time to send our
      // answer back to the caller so they know that we want to talk
      // and how to talk to us.
      const answerMsg: NegotiationMessage = {
        mediaType,
        type: MessageType.RTC_ANSWER,
        sdp: pc.localDescription,
        from: this.id,
        target: from
      };
      this.signaling.sendMessage(answerMsg);
    } catch (e) {
      console.error(e);
    }
    return null;
  }
  
  handleConnectionStateChangeEvent(event, mediaType: MediaType) {
    console.log(event.type, event);
    let stateEvent;
    switch (event.target.connectionState) {
      case 'connected':
        stateEvent = STATE_EVENTS.CONNECTED;
        break;
      case 'disconnected':
        stateEvent = STATE_EVENTS.DISCONNECTED;
        break;
      case 'failed':
        stateEvent = STATE_EVENTS.FAILED;
        break;
      case 'closed':
        stateEvent = STATE_EVENTS.CLOSED;
        break;
      default:
        break;
    }
    this.eventEmitter.emit(stateEvent);
    if (this.emiters[mediaType]) {
      this.emiters[mediaType].emit(stateEvent);
    }
  };
  
  // Responds to the MessageType.RTC_ANSWER message sent to the caller
  // once the callee has decided to accept our request to talk.
  handleAnswerMsg(msg: NegotiationMessage) {
    //1. Create an RTCSessionDescription using the received SDP answer
    const { sdp, from, mediaType } = msg;
    const desc = new RTCSessionDescription(sdp);
    //2. Pass the session description to RTCPeerConnection.setRemoteDescription() to configure Caller’s WebRTC layer to
    //   know how Callee’s end of the connection is configured
    this.peerConnections[mediaType][from].setRemoteDescription(desc).catch(console.error);
  }
  
  // A new ICE candidate has been received from the other peer. Call
  // RTCPeerConnection.addIceCandidate() to send it along to the
  // local ICE framework.
  handleNewIceCandidateMsg({ sdpMLineIndex, sdpMid, candidate, from, mediaType }: ICECandidateMessage) {
    //1. Create an RTCIceCandidate object using the SDP provided in the candidate
    const ice = new RTCIceCandidate({
      sdpMLineIndex,
      candidate
    });
    console.log("Adding received ICE candidate: " + JSON.stringify(ice), `Of type ${mediaType}`);
    //2. Deliver the candidate to self ICE layer by passing it to RTCPeerConnection.addIceCandidate()
    if (this.peerConnections[mediaType] && this.peerConnections[mediaType][from]) {
      this.peerConnections[mediaType][from].addIceCandidate(ice).catch(console.error);
    }
  }
  
  private handleCandidate(iceCandidate: RTCIceCandidate, mediaType: MediaType) {
    if (iceCandidate) {
      const { sdpMLineIndex, sdpMid, candidate } = iceCandidate;
      const msg: ICECandidateMessage = {
        from: this.id,
        type: MessageType.CANDIDATE,
        sdpMLineIndex,
        sdpMid,
        candidate,
        mediaType
      };
      this.signaling.sendMessage(msg);
    } else {
      console.log('End of candidates.');
    }
  }
  
  private handleSourceTrack(track: MediaStreamTrack, mediaType: MediaType) {
    const stream = this.destStream[mediaType] || new MediaStream();
    this.destStream[mediaType] = stream;
    if (this.streamDestination[mediaType]) {
      this.streamDestination[mediaType]['srcObject'] = stream;
    } else {
      console.log(`No video element for ${mediaType}`);
    }
    stream.addTrack(track);
  }
  
  async handleNewUser(userId: string) {
    console.log(userId);
    this.connectionsCount++;
    this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
    for (const mediaType of Object.keys(this.streamDestination)) {
      await this.createOffer(mediaType as MediaType, userId);
    }
  }
  
  setId(id: string) {
    this.id = id;
  }
  
  async join(room, isStreamer) {
    await this.signaling.setupSocket();
    
    this.signaling.sendMessage({
      type: MessageType.JOIN,
      room,
      isStreamer
    });
  }
  
  stop() {
    for (const stream of Object.values(this.sourceStream)) {
      this.stopTracks(stream.getTracks());
    }
    this.signaling.disconnect()
  }
  
  private stopTracks(tracks: MediaStreamTrack[]) {
    for (const track of tracks) {
      track.stop();
    }
  }
  
  mute() {
    if (this.sourceStream.userMedia) {
      this.enableTracks(this.sourceStream.userMedia.getAudioTracks());
    }
  }
  
  private enableTracks(tracks: MediaStreamTrack[]) {
    for (const track of tracks) {
      track.enabled = !track.enabled;
    }
  }
  
  disableVideo() {
    if (this.sourceStream.userMedia) {
      this.enableTracks(this.sourceStream.userMedia.getVideoTracks());
    }
  }
  
  async setSourceVideo(type: MediaType = 'userMedia', videoElement: HTMLVideoElement) {
    const stream = (type == 'userMedia') ? await this.getMedia() : await this.getDisplay();
    this.streamDestination[type] = videoElement;
    this.streamDestination[type]['srcObject'] = stream;
    this.sourceStream[type] = stream;
  }
  
  removeConnectionType(type: MediaType = 'userMedia') {
    //stop tracks from source video
    const stream = this.sourceStream[type];
    stream && this.stopTracks(stream.getTracks());
    this.streamDestination[type]['srcObject'] = null;
    delete this.streamDestination[type];
    for (const pcId of Object.keys(this.peerConnections[type])) {
      console.log('close');
      this.peerConnections[type][pcId].close();
      delete this.peerConnections[type][pcId];
    }
  }
  
  addConnectionType(type: MediaType = 'userMedia') {
    const existingType = type == 'userMedia' ? 'displayMedia' : 'userMedia';
    for (const pcId of Object.keys(this.peerConnections[existingType])) {
      this.createOffer(type, pcId);
    }
  }
  
  connectDestinationVideo(type: MediaType = 'userMedia', videoElement: HTMLVideoElement): EventEmitter {
    this.streamDestination[type] = videoElement;
    const emitter = new EventEmitter<string | symbol>();
    this.emiters[type] = emitter;
    return emitter;
  }
  
  on(event: string, fn: EventEmitter.ListenerFn, context?: any) {
    return this.eventEmitter.on(event, fn, context);
  }
  
  off(event: string, fn: EventEmitter.ListenerFn, context?: any, once?: boolean) {
    return this.eventEmitter.off(event, fn, context, once);
  }
  
  destroy() {
    this.eventEmitter.removeAllListeners()
  }
  
  handleDisconnect(userId?: string) {
    if (userId == this.id) { // this user disconnected -> close all connections
      this.closeAllConnections();
      this.connectionsCount = 0;
    } else { // other user disconnected -> close client connection
      this.closeConnection(userId);
      this.connectionsCount--;
    }
    console.log(`Connections count ${this.connectionsCount}`);
    this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
  }
  
  
  private closeConnection(userId: string) {
    for (const type of Object.keys(this.peerConnections)) {
      const pc: RTCPeerConnection = this.peerConnections[type][userId];
      pc && pc.close();
      delete this.peerConnections[type][userId];
    }
  }
  
  private closeAllConnections() {
    for (const type of Object.keys(this.peerConnections)) {
      for (const pc of Object.values(this.peerConnections[type])) {
        pc.close();
      }
      this.peerConnections[type] = {};
    }
  }
}

export default RTC;
