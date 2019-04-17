import { ICECandidateMessage, NegotiationMessage, RTCMessage } from "./RTCMessage";
export interface SignalingDelegate {
    handleNewIceCandidateMsg(msg: ICECandidateMessage): void;
    handleAnswerMsg(msg: NegotiationMessage): void;
    handleOfferMsg(msg: NegotiationMessage): void;
    handleNewUser(userId: string): void;
    setId(id: string): void;
    handleDisconnect(userId?: string): void;
}
declare class SignalingChannel {
    private wsURL;
    private id;
    private __debug;
    constructor(wsURL: string);
    private socket;
    delegate: SignalingDelegate;
    setupSocket(): Promise<{}>;
    sendMessage(msg: RTCMessage): void;
    disconnect(): void;
    private log;
}
export default SignalingChannel;
