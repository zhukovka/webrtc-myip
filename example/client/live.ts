import { RTC_CONFIG, WS_SERVER_URL } from "./config";
import RTC, { STATE_EVENTS } from "../../src";

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
rtc['__debug'] = true;

async function streamerFlow(room: string) {
    await rtc.setupMedia('userMedia');
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
    display.on(STATE_EVENTS.CLOSED, () => {
        console.log('display connection closed');
    });
    await rtc.join(room, isStreamer);
}

document.getElementById('join').addEventListener('click', async () => {
    
    try {
        if (isStreamer) {
            await streamerFlow(room);
            let sharedScreen = false;
            const shareBtn = document.createElement('button');
            shareBtn.innerText = 'Add/Remove share screen';
            shareBtn.addEventListener('click', async () => {
                if (!sharedScreen) {
                    await rtc.setupMedia('displayMedia');
                    rtc.addConnectionType('displayMedia');
                } else {
                    rtc.removeConnectionType('displayMedia');
                }
                sharedScreen = !sharedScreen;
            });
            screenEl.insertAdjacentElement('afterend', shareBtn);
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

