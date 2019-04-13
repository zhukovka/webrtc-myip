import * as React from "react";
interface RTCProps {
    room: string;
    isStreamer: boolean;
}
interface RTCState {
    joined: boolean;
    listeners: number;
    display: boolean;
}
declare class RTCVideo extends React.Component<RTCProps, RTCState> {
    private rtc;
    state: RTCState;
    constructor(props: any);
    componentDidMount(): void;
    join(): Promise<void>;
    toggleDisplay(): Promise<void>;
    render(): React.ReactElement;
}
export default RTCVideo;
