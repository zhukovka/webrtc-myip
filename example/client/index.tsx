import * as React from 'react';
import * as ReactDOM from 'react-dom';
import RTCVideo from "./components/RTCVideo";

const queryString = require('query-string');
const { room, isStreamer } = queryString.parse(location.search);

ReactDOM.render(
  <RTCVideo room={room} isStreamer={isStreamer === 'true'} />,
  document.getElementById('root'),
);
