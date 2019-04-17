export declare enum MessageType {
    RTC_OFFER = 0,
    CANDIDATE = 1,
    RTC_ANSWER = 2,
    JOIN = 3,
    STOP_STREAM = 4
}
export declare type MediaType = 'displayMedia' | 'userMedia';
export interface RTCMessage {
    type: MessageType;
}
export interface TargetMessage extends RTCMessage {
    target: string;
    from: string;
}
export interface ICECandidateMessage extends RTCMessage {
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    candidate?: string;
    from: string;
    mediaType: MediaType;
}
export interface JoinMessage extends RTCMessage {
    type: MessageType.JOIN;
    room: string;
    isStreamer: boolean;
}
export interface NegotiationMessage extends TargetMessage {
    sdp: RTCSessionDescription;
    mediaType: MediaType;
}
