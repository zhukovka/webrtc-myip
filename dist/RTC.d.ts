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
    private mediaConstraints;
    private sourceStream;
    private destStream;
    private id;
    private signaling;
    private readonly peerConnections;
    private streamDestination;
    private emiters;
    private eventEmitter;
    private connectionsCount;
    constructor(wsURL: string);
    getMedia(): Promise<MediaStream>;
    getDisplay(): Promise<MediaStream>;
    createPeerConnection(mediaType: MediaType): RTCPeerConnection;
    addTracksToPC(peerConnection: RTCPeerConnection, stream: MediaStream): void;
    removeTracksFromPC(peerConnection: RTCPeerConnection): void;
    getOrCreatePeerConnection(mediaType: MediaType, userId: string): RTCPeerConnection;
    createOffer(mediaType: MediaType, userId: string): Promise<void>;
    handleOfferMsg(msg: NegotiationMessage): Promise<any>;
    handleConnectionStateChangeEvent(event: any, mediaType: MediaType): void;
    handleAnswerMsg(msg: NegotiationMessage): void;
    handleNewIceCandidateMsg({ sdpMLineIndex, sdpMid, candidate, from, mediaType }: ICECandidateMessage): void;
    private handleCandidate;
    private handleSourceTrack;
    handleNewUser(userId: string): Promise<void>;
    setId(id: string): void;
    join(room: any, isStreamer: any): Promise<void>;
    stop(): void;
    private stopTracks;
    mute(): void;
    private enableTracks;
    disableVideo(): void;
    setSourceVideo(type: MediaType, videoElement: HTMLVideoElement): Promise<void>;
    removeConnectionType(type?: MediaType): void;
    addConnectionType(type?: MediaType): void;
    connectDestinationVideo(type: MediaType, videoElement: HTMLVideoElement): EventEmitter;
    on(event: string, fn: EventEmitter.ListenerFn, context?: any): EventEmitter<string | symbol>;
    off(event: string, fn: EventEmitter.ListenerFn, context?: any, once?: boolean): EventEmitter<string | symbol>;
    destroy(): void;
    handleDisconnect(userId?: string): void;
    private closeConnection;
    private closeAllConnections;
}
export default RTC;
