import { ICECandidateMessage, JoinMessage, MediaType, MessageType, NegotiationMessage } from "./RTCMessage";
import SignalingChannel, { SignalingDelegate } from "./SignalingChannel";
// @ts-ignore
import adapter from 'webrtc-adapter';
import * as EventEmitter from "eventemitter3";

if (!adapter) {
// unused import hack
}

export enum CLIENT_EVENTS {
    COUNT_CHANGED = 'clientsCountChanged',
    NEW_CLIENT = 'newClientConnected'
}

export enum STREAM_EVENTS {
    REMOTE_USER_MEDIA = 'remoteUserMedia',
    REMOTE_DISPLAY = 'remoteDisplay'
}

interface PeerConnections {
    [type: string]: {
        [id: string]: RTCPeerConnection;
    };
}

interface SourceStream {
    userMedia?: MediaStream;
    displayMedia?: MediaStream;
}

interface ConnectionEmitter {
    userMedia?: EventEmitter<string | symbol>;
    displayMedia?: EventEmitter<string | symbol>;
}

export type LogLevel = 'log' | 'trace';

class RTC implements SignalingDelegate {
    set _debug(value: LogLevel) {
        this.__debug = value;
        this.signaling._debug = !!this.__debug;
    }
    
    private sourceStream: SourceStream = {};
    private destStream: SourceStream = {};
    private id: string;
    private signaling: SignalingChannel;
    private readonly peerConnections: PeerConnections;
    private eventEmitter: EventEmitter<string | symbol>;
    private connectionsCount: number;
    private __debug: LogLevel;
    private __isStreamer: boolean;
    
    /**
     * Creates WebRTC client instance
     * example:
     * ```
     * const WS_SERVER_URL = window.location.origin;
     * const RTC_CONFIG = { 'iceServers': [ { "urls": [ "stun:64.233.165.127:19302" ] }]};
     * const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);
     * ```
     * @param wsURL
     * @param config
     */
    constructor(wsURL: string, private config?: RTCConfiguration) {
        this.peerConnections = {};
        this.signaling = new SignalingChannel(wsURL);
        this.signaling.delegate = this;
        this.connectionsCount = 0;
        this.eventEmitter = new EventEmitter();
    }
    
    private async getMedia(constraints: MediaStreamConstraints = { audio: true, video: true }) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    
    private async getDisplay(): Promise<MediaStream> {
        // @ts-ignore
        return navigator.mediaDevices.getDisplayMedia({ video: true });
    }
    
    /**
     *
     * @param mediaType
     */
    private createPeerConnection(mediaType: MediaType) {
        try {
            const pc = new RTCPeerConnection(this.config);
            // Handles |icecandidate| events by forwarding the specified
            // ICE candidate (created by our local ICE agent) to the other
            // peer through the signaling server.
            pc.onicecandidate = (event) => {
                this.log('sending ICE candidate', event);
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
                this.log(`Track event for ${mediaType}`, event);
                this.handleSourceTrack(event.track, mediaType);
            };
            pc.onconnectionstatechange = (event) => {
                this.log(event.type, pc.connectionState, this.id, event);
                this.handleConnectionStateChangeEvent(pc, mediaType);
            };
            pc.onsignalingstatechange = (event) => {
                this.log(event.type, pc.signalingState, this.id, event);
                this.handleConnectionStateChangeEvent(pc, mediaType);
            };
            pc.ondatachannel = (...args) => this.log('ondatachannel', args);
            pc.onnegotiationneeded = (...args) => this.log('onnegotiationneeded', args);
            this.log('Created RTCPeerConnnection');
            return pc;
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            return;
        }
    }
    
    private handleConnectionStateChangeEvent(pc: RTCPeerConnection, mediaType: MediaType) {
        switch (pc.connectionState) {
            case 'connected':
                break;
            case 'failed':
                break;
            case 'closed':
            case 'disconnected':
                this.handlePeerDisconnected(pc, mediaType);
                break;
            default:
                break;
        }
    };
    
    private addTracksToPC(peerConnection: RTCPeerConnection, stream: MediaStream) {
        if (!stream) {
            return;
        }
        for (const track of stream.getTracks()) {
            peerConnection.addTrack(track)
        }
    }
    
    private removeTracksFromPC(peerConnection: RTCPeerConnection) {
        for (const sender of peerConnection.getSenders()) {
            peerConnection.removeTrack(sender);
        }
    }
    
    private getOrCreatePeerConnection(mediaType: MediaType, userId: string): RTCPeerConnection {
        const peerConnection = this.peerConnections[mediaType] || (this.peerConnections[mediaType] = {});
        const pc = peerConnection[userId] || this.createPeerConnection(mediaType);
        peerConnection[userId] = pc;
        return pc;
    }
    
    // Called by the WebRTC layer to let us know when it's time to
    // begin (or restart) ICE negotiation. Starts by creating a WebRTC
    // offer, then sets it as the description of our local media
    // (which configures our local media stream), then sends the
    // description to the callee as an offer. This is a proposed media
    // format, codec, resolution, etc.
    private async createOffer(mediaType: MediaType, userId: string) {
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
    
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * Accept an offer to video chat. We configure our local settings,
     * create our RTCPeerConnection, get and attach our local camera
     * stream, then create and send an answer to the caller.
     * @param msg
     */
    async handleOfferMsg({ mediaType, sdp, from }: NegotiationMessage): Promise<null> {
        this.log(`GOT OFFER from ${from} to ${this.id}`);
        try {
            // 1. Create an RTCPeerConnection
            const pc = this.getOrCreatePeerConnection(mediaType, from);
            this.removeTracksFromPC(pc);
            
            if (this.__isStreamer) {
                this.addTracksToPC(pc, this.sourceStream[mediaType]);
            }
            
            this.destStream[mediaType] = null;
            // 2. Create an RTCSessionDescription using the received SDP offer
            const desc = new RTCSessionDescription(sdp);
            // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
            await pc.setRemoteDescription(desc);
            // 6. Promise fulfilled: call RTCPeerConnection.createAnswer() to create an SDP answer to send to Caller
            const answer = await pc.createAnswer();
            // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
            await pc.setLocalDescription(answer);
            this.log("CREATED ANSWER", answer);
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
    
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * meaning an answer to the Presenter's offer has been received.
     * Responds to the message sent to the caller
     * once the callee has decided to accept the request to talk.
     *
     * @param msg
     */
    handleAnswerMsg({ sdp, from, mediaType }: NegotiationMessage): void {
        //1. Create an RTCSessionDescription using the received SDP answer
        const desc = new RTCSessionDescription(sdp);
        //2. Pass the session description to RTCPeerConnection.setRemoteDescription() to configure Caller’s WebRTC layer to
        //   know how Callee’s end of the connection is configured
        const pc = this.peerConnections[mediaType][from];
        pc.setRemoteDescription(desc).catch(console.error);
    }
    
    
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link ICECandidateMessage}
     * meaning a new ICE candidate has been received from the other peer.
     *
     * @param sdpMLineIndex
     * @param sdpMid
     * @param candidate
     * @param from
     * @param mediaType
     */
    handleNewIceCandidateMsg({ sdpMLineIndex, sdpMid, candidate, from, mediaType }: ICECandidateMessage) {
        //1. Create an RTCIceCandidate object using the SDP provided in the ICECandidateMessage
        const ice = new RTCIceCandidate({
            sdpMLineIndex,
            candidate
        });
        
        //2. Deliver the candidate to self ICE layer by passing it to RTCPeerConnection.addIceCandidate()
        if (this.peerConnections[mediaType] && this.peerConnections[mediaType][from]) {
            this.peerConnections[mediaType][from].addIceCandidate(ice).catch(console.error);
        }
        this.log("Adding received ICE candidate: " + JSON.stringify(ice), `Of type ${mediaType}`);
    }
    
    private handleCandidate(iceCandidate: RTCIceCandidate, mediaType: MediaType): void {
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
            this.log('End of candidates.');
        }
    }
    
    private handleSourceTrack(track: MediaStreamTrack, mediaType: MediaType): void {
        const stream = this.destStream[mediaType] || new MediaStream();
        this.destStream[mediaType] = stream;
        stream.addTrack(track);
        const eventType = (mediaType == 'userMedia') ? STREAM_EVENTS.REMOTE_USER_MEDIA : STREAM_EVENTS.REMOTE_DISPLAY;
        this.eventEmitter.emit(eventType, stream);
    }
    
    /**
     * {@link SignalingDelegate} method to handle socket event 'other' (other user joined)
     * @param userId
     */
    async handleNewUser(userId: string): Promise<void> {
        this.log(userId);
        this.connectionsCount++;
        this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
        for (const mediaType of Object.keys(this.sourceStream)) {
            await this.createOffer(mediaType as MediaType, userId);
        }
    }
    
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'me' (this user joined)
     * @param id
     */
    setId(id: string): void {
        this.id = id;
    }
    
    /**
     * Sends {@link JoinMessage} message to the websocket.
     * Returns a promise that resolves on the socket connection and rejects on the socket error
     *
     * Example:
     * ```
     * const room = '123';
     * const isStreamer = true;
     * rtc.join(room, isStreamer);
     * ```
     * @param room
     * @param isStreamer
     */
    async join(room: string, isStreamer: boolean): Promise<EventEmitter<string | symbol>> {
        this.log('join', room, isStreamer);
        this.__isStreamer = isStreamer;
        await this.signaling.setupSocket();
        let msg: JoinMessage = {
            type: MessageType.JOIN,
            room,
            isStreamer
        };
        this.signaling.sendMessage(msg);
        return this.eventEmitter;
    }
    
    /**
     * Stops streams and disconnects from the socket server
     */
    stop(): void {
        for (const stream of Object.values(this.sourceStream)) {
            this.stopTracks(stream.getTracks());
        }
        this.signaling.disconnect();
    }
    
    private stopTracks(tracks: MediaStreamTrack[]): void {
        for (const track of tracks) {
            track.stop();
        }
    }
    
    /**
     * Toggles muted state of a user's audio
     */
    mute(): void {
        if (this.sourceStream.userMedia) {
            this.enableTracks(this.sourceStream.userMedia.getAudioTracks());
        }
    }
    
    private enableTracks(tracks: MediaStreamTrack[]): void {
        for (const track of tracks) {
            track.enabled = !track.enabled;
        }
    }
    
    /**
     * Toggles enabled state of a user's media (webcam)
     */
    disableVideo(): void {
        if (this.sourceStream.userMedia) {
            this.enableTracks(this.sourceStream.userMedia.getVideoTracks());
        }
    }
    
    /**
     * Sets the Presenter's stream source from either webcam or display and related HTMLVideoElement.
     * It returns a Promise that resolves to a MediaStream object. If the user denies permission,
     * or matching media is not available, then the promise is rejected with NotAllowedError or NotFoundError respectively.
     *
     * Example:
     * ```
     * const mediaType = 'userMedia';
     * const userMedia = document.getElementById("userMedia");
     * rtc.setupMedia('userMedia', userMedia);
     * ```
     * @param type
     * @param mediaConstraints - optional parameter. Defaults to `{ audio: true, video: true }` for user media (webcam)
     * and is *NOT* configurable for screen sharing as audio is not supported https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
     */
    async setupMedia(type: MediaType = 'userMedia', mediaConstraints?: MediaStreamConstraints): Promise<MediaStream> {
        try {
            const stream = (type == 'userMedia') ? await this.getMedia(mediaConstraints) : await this.getDisplay();
            this.sourceStream[type] = stream;
            return stream;
        } catch (e) {
            throw e;
        }
    }
    
    /**
     * Closes PeerConnection of the specified {@link MediaType} on Presenter's side.
     * Removes media stream from the video element it is attached to.
     * @param type
     */
    private removeConnectionType(type: MediaType = 'userMedia'): void {
        //stop tracks from source video
        const stream = this.sourceStream[type];
        stream && this.stopTracks(stream.getTracks());
        delete this.sourceStream[type];
        //close all connections of the type
        for (const pcId of Object.keys(this.peerConnections[type])) {
            this.log(`close connection with ${pcId}`);
            this.peerConnections[type][pcId].close();
            delete this.peerConnections[type][pcId];
        }
    }
    
    /**
     * Opens PeerConnection of the specified {@link MediaType} on Presenter's side.
     * @param type
     */
    private addConnectionType(type: MediaType = 'userMedia'): void {
        const existingType = type == 'userMedia' ? 'displayMedia' : 'userMedia';
        //invite all viewers of the existing media to a stream of a new type
        for (const peerId of Object.keys(this.peerConnections[existingType])) {
            this.createOffer(type, peerId).catch(console.error);
        }
    }
    
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'disconnect'.
     * @param userId
     */
    handleDisconnect(userId?: string): void {
        if (userId == this.id) { // this user disconnected -> close all connections
            this.closeAllConnections();
            this.connectionsCount = 0;
        } else { // other user disconnected -> close client connection
            this.closeConnection(userId);
            this.connectionsCount--;
        }
        this.log(`Connections count ${this.connectionsCount}`);
        this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
    }
    
    
    private closeConnection(userId: string): void {
        for (const type of Object.keys(this.peerConnections)) {
            const peerConnection = this.peerConnections[type];
            const pc: RTCPeerConnection = peerConnection[userId];
            pc && pc.close();
            delete peerConnection[userId];
        }
    }
    
    private closeAllConnections(): void {
        //reduce peer connections map to peer connections array
        const allPC = Object.values(this.peerConnections).reduce((arr, obj) => arr.concat(Object.values(obj)), []);
        for (const pc of allPC) {
            pc.close();
        }
    }
    
    private log(...args: any[]): void {
        if (this.__debug) {
            console.log(...args);
        }
        if (this.__debug == 'trace') {
            console.groupCollapsed('trace');
            console.trace();
            console.groupEnd();
        }
    }
    
    async startScreenSharing() {
        const media = await this.setupMedia('displayMedia');
        this.addConnectionType('displayMedia');
        return media;
    }
    
    stopScreenSharing() {
        this.removeConnectionType('displayMedia');
    }
    
    private handlePeerDisconnected(pc: RTCPeerConnection, mediaType: MediaType) {
        this.destStream[mediaType] = null;
        for (const peerId of Object.keys(this.peerConnections[mediaType])) {
            if (this.peerConnections[mediaType][peerId] == pc) {
                this.log(`delete ${mediaType} connection with ${peerId}`);
                this.peerConnections[mediaType][peerId] = null;
                delete this.peerConnections[mediaType][peerId];
            }
        }
        this.eventEmitter.emit((mediaType == 'userMedia') ? STREAM_EVENTS.REMOTE_USER_MEDIA : STREAM_EVENTS.REMOTE_DISPLAY, null);
    }
}

export default RTC;
