import { ICECandidateMessage, MediaType, NegotiationMessage } from "./RTCMessage";
import { SignalingDelegate } from "./SignalingChannel";
import * as EventEmitter from "eventemitter3";
export declare enum CLIENT_EVENTS {
    COUNT_CHANGED = "clientsCountChanged",
    NEW_CLIENT = "newClientConnected"
}
export declare enum STREAM_EVENTS {
    REMOTE_USER_MEDIA = "remoteUserMedia",
    REMOTE_DISPLAY = "remoteDisplay"
}
export declare type LogLevel = 'log' | 'trace';
declare class RTC implements SignalingDelegate {
    private config?;
    _debug: LogLevel;
    private sourceStream;
    private destStream;
    private id;
    private signaling;
    private readonly peerConnections;
    private eventEmitter;
    private connectionsCount;
    private __debug;
    private __isStreamer;
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
    private handleConnectionStateChangeEvent;
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
    handleOfferMsg({ mediaType, sdp, from }: NegotiationMessage): Promise<null>;
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
    join(room: string, isStreamer: boolean): Promise<EventEmitter<string | symbol>>;
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
     * rtc.setupMedia('userMedia', userMedia);
     * ```
     * @param type
     * @param mediaConstraints - optional parameter. Defaults to `{ audio: true, video: true }` for user media (webcam)
     * and is *NOT* configurable for screen sharing as audio is not supported https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
     */
    setupMedia(type?: MediaType, mediaConstraints?: MediaStreamConstraints): Promise<MediaStream>;
    /**
     * Closes PeerConnection of the specified {@link MediaType} on Presenter's side.
     * Removes media stream from the video element it is attached to.
     * @param type
     */
    private removeConnectionType;
    /**
     * Opens PeerConnection of the specified {@link MediaType} on Presenter's side.
     * @param type
     */
    private addConnectionType;
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'disconnect'.
     * @param userId
     */
    handleDisconnect(userId?: string): void;
    private closeConnection;
    private closeAllConnections;
    private log;
    startScreenSharing(): Promise<MediaStream>;
    stopScreenSharing(): void;
    private handlePeerDisconnected;
}
export default RTC;
