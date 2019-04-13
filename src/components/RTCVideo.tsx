import * as React from "react";
// import RTC, { MediaType } from "rtc-client";
// do NOT delete this commented code please (need for development)
import RTC, { CLIENT_EVENTS, STATE_EVENTS } from "../RTC";

interface RTCProps {
  room: string
  isStreamer: boolean;
}

interface RTCState {
  joined: boolean;
  listeners: number;
  display: boolean;
}

// const WS_SERVER_URL = 'https://wix-live-ws-server.herokuapp.com/';
const WS_SERVER_URL = 'http://localhost:5000/';

class RTCVideo extends React.Component<RTCProps, RTCState> {
  private rtc: RTC;
  state: RTCState = {
    display: false,
    joined: false,
    listeners: 0
  };
  
  constructor(props) {
    super(props);
  }
  
  componentDidMount(): void {
    this.rtc = new RTC(WS_SERVER_URL);
    const { isStreamer } = this.props;
    const userMedia = document.getElementById("userMedia") as HTMLVideoElement;
    const displayMedia = document.getElementById("displayMedia") as HTMLVideoElement;
    if (isStreamer) {
      this.rtc.setSourceVideo('userMedia', userMedia);
    } else {
      const webcam = this.rtc.connectDestinationVideo('userMedia', userMedia);
      webcam.on(STATE_EVENTS.CONNECTED, () => {
        console.log('webcam connected')
      });
      const display = this.rtc.connectDestinationVideo('displayMedia', displayMedia);
      display.on(STATE_EVENTS.CONNECTED, () => {
        console.log('display connected')
      });
      display.on(STATE_EVENTS.DISCONNECTED, () => {
        console.log('display disconnected')
      });
    }
    this.rtc.on(CLIENT_EVENTS.COUNT_CHANGED, (listeners) => {
      this.setState({ listeners })
    })
  }
  
  async join() {
    const { room, isStreamer } = this.props;
    console.log('Join');
    try {
      if (room) {
        await this.rtc.join(room, isStreamer);
        this.setState({ joined: true })
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  async toggleDisplay() {
    const { display } = this.state;
    if (display) {
      this.rtc.removeConnectionType('displayMedia');
    } else {
      const displayMedia = document.getElementById("displayMedia") as HTMLVideoElement;
      await this.rtc.setSourceVideo('displayMedia', displayMedia);
      this.rtc.addConnectionType('displayMedia');
    }
    this.setState({ display: !display });
  }
  
  render(): React.ReactElement {
    const { room, isStreamer } = this.props;
    
    if (!room) {
      return <div>Set room in query string ie {window.location.origin}/?room=123</div>
    }
    
    const { listeners, joined } = this.state;
    return (<div>
      Room: {room}; Listeners: {listeners}
      {!joined && <button onClick={() => this.join().catch(console.error)}>Join</button>}
      <div>
        <video
          id={"userMedia"}
          autoPlay
          playsInline
          muted
        >
        </video>
        <video
          id={"displayMedia"}
          autoPlay
          playsInline
          muted
        >
        </video>
        {!!isStreamer &&
        <div>
          <button onClick={() => this.rtc.stop()}>Stop</button>
          <button onClick={() => this.rtc.mute()}>Mute</button>
          <button onClick={() => this.toggleDisplay()}>Add/Remove display media</button>
        </div>
        }
      </div>
    </div>)
  }
}

export default RTCVideo;
