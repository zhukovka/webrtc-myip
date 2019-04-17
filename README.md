# WebRTC-myip - webRTC client

A library for WebRTC media streaming

| **Presenter's flow**  	| **Viewer's flow**  	|
|---------------------------|-----------------------|
| 1. Create webRTC client instance  	   	||
```const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);```||
| 2. Set media source  	|  2. Set media destination 	
```rtc.setSourceVideo('userMedia', userMedia);```| ```rtc.connectDestinationVideo('userMedia', userMedia);```
| 3. Join a room as a streamer  	|  3. Join a room as a viewer 	
```rtc.join(room, true);```|```rtc.join(room, false);```

## Install
`npm install webrtc-myip`


## Sample usage
```
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
```
See working example code in the [example folder](https://github.com/zhukovka/webrtc-myip/tree/master/example)
## Docs
Read full documentation [here](https://zhukovka.github.io/webrtc-myip/)

## Socket interface
To exchange peer negotiation messages (offer & answer) WebRTC-myip uses web socket.
Pass WS URL in `RTC` instance constructor to connect to your socket.
```
new RTC(WS_SERVER_URL, RTC_CONFIG)
```
Your socket has to implement following types of events:
- `'me'` - passes just connected user id to the connected user
- `'other'` - passes connected user id to Presenter
- `'message'` - translate user's message to other participants

See sample socket code in the [example folder](https://github.com/zhukovka/webrtc-myip/tree/master/example/index.ts)