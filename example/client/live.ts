import { RTC_CONFIG, WS_SERVER_URL } from "./config";
import RTC from "../../src";
import { STREAM_EVENTS } from "../../src/RTC";

const webcamEl = <HTMLVideoElement>document.getElementById('webcam');
const screenEl = <HTMLVideoElement>document.getElementById('screen');
const joinBtn = <HTMLButtonElement>document.getElementById('join');

const queryString = require('query-string');
let { room } = queryString.parse(location.search);
const isStreamer = !room;
if (!room) {
    room = (Date.now() * Math.random()).toFixed();
    history.pushState({ room }, document.title, `${window.location.pathname}?room=${room}`);
}
joinBtn.innerHTML = `Join as a ${isStreamer ? 'streamer' : 'viewer'}`;
document.getElementById('room').innerHTML = room;

const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);
rtc._debug = 'trace';

async function streamerFlow(room: string) {
    webcamEl.srcObject = await rtc.setupMedia('userMedia');
    const connection = await rtc.join(room, isStreamer);
}

function addShareScreenBtn() {
    let sharedScreen = false;
    const shareBtn = document.createElement('button');
    shareBtn.innerText = 'Add/Remove share screen';
    shareBtn.addEventListener('click', async () => {
        if (!sharedScreen) {
            screenEl.srcObject = await rtc.startScreenSharing();
        } else {
            rtc.stopScreenSharing();
            screenEl.srcObject = null;
        }
        sharedScreen = !sharedScreen;
    });
    screenEl.insertAdjacentElement('afterend', shareBtn);
}

async function viewerFlow(room: string) {
    const connection = await rtc.join(room, isStreamer);
    connection.on(STREAM_EVENTS.REMOTE_USER_MEDIA, (stream: MediaStream) => {
        webcamEl.srcObject = stream;
    });
    connection.on(STREAM_EVENTS.REMOTE_DISPLAY, (stream: MediaStream) => {
        screenEl.srcObject = stream;
    });
}

document.getElementById('join').addEventListener('click', async () => {
    
    try {
        if (isStreamer) {
            await streamerFlow(room);
            addShareScreenBtn();
        } else {
            await viewerFlow(room);
        }
        const element = joinBtn.parentElement;
        joinBtn.remove();
        element.innerHTML = `Invite link: ${window.location.href}`;
    } catch (e) {
        console.error(e)
    }
});

