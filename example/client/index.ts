import { RTC_CONFIG, WS_SERVER_URL } from "./config";
import RTC, { STATE_EVENTS } from "../../src/RTC";

const queryString = require('query-string');
let { room } = queryString.parse(location.search);

if (!room) {
    room = (Date.now() * Math.random()).toFixed();
    history.pushState({ room }, document.title, `${window.location.pathname}?room=${room}`);
    console.log('👉 first')
}
document.getElementById('room').innerHTML = room;


async function start(room: string) {
    const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);
    rtc['__debug'] = true;
    // setup remote video
    const remote = <HTMLVideoElement>document.getElementById('remote');
    
    const remoteConnection = rtc.connectDestinationVideo('userMedia', remote);
    remoteConnection.on(STATE_EVENTS.CONNECTED, () => {
        console.log('webcam connected')
    });
    
    // setup local video
    const local = <HTMLVideoElement>document.getElementById('local');
    await rtc.setSourceVideo('userMedia', local);
    
    await rtc.join(room, true);
}

document.getElementById('join').addEventListener('click', () => start(room));