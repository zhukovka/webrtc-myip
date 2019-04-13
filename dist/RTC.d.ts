import { ListenerFn } from 'eventemitter3';
import { TargetMessage } from './RTCMessage';
import { SignalingDelegate } from './SignalingChannel';
export declare enum STATE_EVENTS {
    CONNECTED = "state-events/connected",
    FAILED = "playback-events/failed",
    CLOSED = "playback-events/closed"
}
export declare type MediaType = 'desktop' | 'webcam';
declare class RTC implements SignalingDelegate {
    private mediaConstraints;
    private localStream;
    private remoteStream;
    private id;
    private signaling;
    private peerConnections;
    private eventEmitter;
    videoElement: HTMLElement;
    private _videoElement;
    constructor(wsURL: string);
    getMedia(): Promise<MediaStream>;
    getDisplay(): Promise<MediaStream>;
    createPeerConnection(): RTCPeerConnection;
    addTracks(peerConnection: RTCPeerConnection): void;
    removeTracks(peerConnection: RTCPeerConnection): void;
    createOffer(toId: string): Promise<void>;
    handleOfferMsg(msg: TargetMessage): Promise<any>;
    handleConnectionStateChangeEvent(event: any): void;
    handleAnswerMsg(msg: any): void;
    handleNewIceCandidateMsg(msg: any): void;
    handleICECandidateEvent(event: any): void;
    private handleTrackEvent;
    handleNewUser(userId: string): void;
    setId(id: string): void;
    join(room: any, isStreamer: any): Promise<void>;
    stop(): void;
    private stopTracks;
    mute(): void;
    disableVideo(): void;
    switchSource(type: MediaType): Promise<void>;
    setupVideo(type?: MediaType): Promise<void>;
    on(event: string, fn: ListenerFn, context?: any): any;
    off(event: string, fn: ListenerFn, context?: any, once?: boolean): any;
    destroy(): void;
}
export default RTC;
