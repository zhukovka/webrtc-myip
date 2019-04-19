import { RTC_CONFIG, WS_SERVER_URL } from "./config";
import RTC, { STREAM_EVENTS } from "../../src/RTC";

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
    rtc._debug = 'trace';
    
    // setup local video
    const local = <HTMLVideoElement>document.getElementById('local');
    local.srcObject = await rtc.setupMedia('userMedia');
    
    const connection = await rtc.join(room, true);
    
    // setup remote video
    const remote = <HTMLVideoElement>document.getElementById('remote');
    connection.on(STREAM_EVENTS.REMOTE_USER_MEDIA, (stream: MediaStream) => {
        remote.srcObject = stream;
    });
    
    document.getElementById('join').parentElement.innerHTML = `Invite link: ${window.location.href}`;
}

document.getElementById('join').addEventListener('click', () => start(room));