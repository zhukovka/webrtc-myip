export declare enum MessageType {
    RTC_OFFER = 0,
    CANDIDATE = 1,
    RTC_ANSWER = 2,
    JOIN = 3,
    STOP_STREAM = 4
}
export interface RTCMessage {
    type: MessageType;
}
export interface TargetMessage extends RTCMessage {
    type: MessageType.RTC_OFFER | MessageType.RTC_ANSWER;
    sdp: RTCSessionDescription;
    target: string;
    from: string;
}
export interface JoinMessage extends RTCMessage {
    type: MessageType.JOIN;
    room: string;
    username: string;
    isStreamer: boolean;
}
