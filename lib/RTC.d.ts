import { ICECandidateMessage, MediaType, NegotiationMessage } from "./RTCMessage";
import { SignalingDelegate } from "./SignalingChannel";
import * as EventEmitter from "eventemitter3";
export declare enum STATE_EVENTS {
    CONNECTED = "state-events/connected",
    DISCONNECTED = "state-events/disconnected",
    FAILED = "playback-events/failed",
    CLOSED = "playback-events/closed"
}
export declare enum CLIENT_EVENTS {
    COUNT_CHANGED = "client-events/count-changed"
}
declare class RTC implements SignalingDelegate {
    private config?;
    private sourceStream;
    private destStream;
    private id;
    private signaling;
    private readonly peerConnections;
    private streamDestination;
    private emitters;
    private eventEmitter;
    private connectionsCount;
    private __debug;
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
    constructor(wsURL: string, config?: RTCConfiguration);
    private getMedia;
    private getDisplay;
    /**
     *
     * @param mediaType
     */
    private createPeerConnection;
    private addTracksToPC;
    private removeTracksFromPC;
    private getOrCreatePeerConnection;
    private createOffer;
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * Accept an offer to video chat. We configure our local settings,
     * create our RTCPeerConnection, get and attach our local camera
     * stream, then create and send an answer to the caller.
     * @param msg
     */
    handleOfferMsg({ mediaType, sdp, from }: NegotiationMessage): Promise<any>;
    private handleConnectionStateChangeEvent;
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * meaning an answer to the Presenter's offer has been received.
     * Responds to the message sent to the caller
     * once the callee has decided to accept the request to talk.
     *
     * @param msg
     */
    handleAnswerMsg({ sdp, from, mediaType }: NegotiationMessage): void;
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
    handleNewIceCandidateMsg({ sdpMLineIndex, sdpMid, candidate, from, mediaType }: ICECandidateMessage): void;
    private handleCandidate;
    private handleSourceTrack;
    /**
     * {@link SignalingDelegate} method to handle socket event 'other' (other user joined)
     * @param userId
     */
    handleNewUser(userId: string): Promise<void>;
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'me' (this user joined)
     * @param id
     */
    setId(id: string): void;
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
    join(room: string, isStreamer: boolean): Promise<void>;
    /**
     * Stops streams and disconnects from the socket server
     */
    stop(): void;
    private stopTracks;
    /**
     * Toggles muted state of a user's audio
     */
    mute(): void;
    private enableTracks;
    /**
     * Toggles enabled state of a user's media (webcam)
     */
    disableVideo(): void;
    /**
     * Sets the Presenter's stream source from either webcam or display and related HTMLVideoElement.
     * It returns a Promise that resolves to a MediaStream object. If the user denies permission,
     * or matching media is not available, then the promise is rejected with NotAllowedError or NotFoundError respectively.
     *
     * Example:
     * ```
     * const mediaType = 'userMedia';
     * const userMedia = document.getElementById("userMedia");
     * rtc.setSourceVideo('userMedia', userMedia);
     * ```
     * @param type
     * @param videoElement
     * @param mediaConstraints - optional parameter. Defaults to `{ audio: true, video: true }` for user media (webcam)
     * and is *NOT* configurable for screen sharing as audio is not supported https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
     */
    setSourceVideo(type: MediaType, videoElement: HTMLVideoElement, mediaConstraints?: MediaStreamConstraints): Promise<MediaStream>;
    /**
     * Closes PeerConnection of the specified {@link MediaType} on Presenter's side.
     * Removes media stream from the video element it is attached to.
     * @param type
     */
    removeConnectionType(type?: MediaType): void;
    /**
     * Opens PeerConnection of the specified {@link MediaType} on Presenter's side.
     * @param type
     */
    addConnectionType(type?: MediaType): void;
    /**
     * Connects an HTMLVideoElement to an event emitter on *Viewer's* side.
     * Returns an event emitter to listen to events of {@link STATE_EVENTS} types
     *
     * Example:
     *
     * ```
     * const userMedia = document.getElementById("userMedia");
     * const webcam = this.rtc.connectDestinationVideo('userMedia', userMedia);
     * webcam.on(STATE_EVENTS.CONNECTED, () => {
     *           console.log('webcam connected')
     *       });
     * ```
     *
     * @param type
     * @param videoElement
     */
    connectDestinationVideo(type: MediaType, videoElement: HTMLVideoElement): EventEmitter;
    on(event: string, fn: EventEmitter.ListenerFn, context?: any): EventEmitter<string | symbol>;
    off(event: string, fn: EventEmitter.ListenerFn, context?: any, once?: boolean): EventEmitter<string | symbol>;
    destroy(): void;
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'disconnect'.
     * @param userId
     */
    handleDisconnect(userId?: string): void;
    private closeConnection;
    private closeAllConnections;
    private log;
}
export default RTC;
