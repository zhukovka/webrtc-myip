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

```

## Docs
Read full documentation here [docs](https://zhukovka.github.io/webrtc-myip/)