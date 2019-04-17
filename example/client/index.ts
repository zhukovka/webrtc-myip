import { RTC_CONFIG, WS_SERVER_URL } from "./config";
import RTC, { STATE_EVENTS } from "webrtc-myip";

const webcamEl = <HTMLVideoElement>document.getElementById('webcam');
const screenEl = <HTMLVideoElement>document.getElementById('screen');
const queryString = require('query-string');
const { room, isStreamer } = queryString.parse(location.search);

const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);

console.log(room, isStreamer);

async function streamerFlow(room: string) {
    await rtc.setSourceVideo('userMedia', webcamEl);
    await rtc.join(room, isStreamer);
}

async function viewerFlow(room: string) {
    const webcam = rtc.connectDestinationVideo('userMedia', webcamEl);
    webcam.on(STATE_EVENTS.CONNECTED, () => {
        console.log('webcam connected')
    });
    const display = rtc.connectDestinationVideo('displayMedia', screenEl);
    display.on(STATE_EVENTS.CONNECTED, () => {
        console.log('display connected')
    });
    display.on(STATE_EVENTS.DISCONNECTED, () => {
        console.log('display disconnected')
    });
    await rtc.join(room, isStreamer);
}

if (isStreamer) {
    streamerFlow(room).catch(console.error);
} else {
    viewerFlow(room).catch(console.error);
}
