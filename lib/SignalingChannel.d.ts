export interface SignalingDelegate {
    handleNewIceCandidateMsg(msg: any): any;
    handleAnswerMsg(msg: any): any;
    handleOfferMsg(msg: any): any;
    handleNewUser(userId: string): any;
    setId(id: string): any;
    handleDisconnect(userId?: string): any;
}
declare class SignalingChannel {
    private wsURL;
    private id;
    constructor(wsURL: string);
    private socket;
    delegate: SignalingDelegate;
    setupSocket(): Promise<{}>;
    sendMessage(msg: any): void;
    disconnect(): void;
}
export default SignalingChannel;