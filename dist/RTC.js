"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var webrtc_adapter_1 = require("webrtc-adapter");
var eventemitter3_1 = require("eventemitter3");
var RTCMessage_1 = require("./RTCMessage");
var SignalingChannel_1 = require("./SignalingChannel");
if (!webrtc_adapter_1.default) {
}
var STATE_EVENTS;
(function (STATE_EVENTS) {
    STATE_EVENTS["CONNECTED"] = "state-events/connected";
    STATE_EVENTS["FAILED"] = "playback-events/failed";
    STATE_EVENTS["CLOSED"] = "playback-events/closed";
})(STATE_EVENTS = exports.STATE_EVENTS || (exports.STATE_EVENTS = {}));
//TODO: Warning! This servers are borrowed without permission!
var config = {
    'iceServers': [
        {
            "urls": [
                "stun:64.233.165.127:19302",
                "stun:[2a00:1450:4010:c08::7f]:19302"
            ]
        },
        {
            "urls": [
                "turn:64.233.161.127:19305?transport=udp",
                "turn:[2a00:1450:4010:c01::7f]:19305?transport=udp",
                "turn:64.233.161.127:19305?transport=tcp",
                "turn:[2a00:1450:4010:c01::7f]:19305?transport=tcp"
            ],
            "username": "CNKsvOUFEgb5DoznbPYYzc/s6OMTIICjBQ",
            "credential": "hzb6Xi+YesoW1SZ6P70bo2OOWzk="
        }
    ]
};
var RTC = /** @class */ (function () {
    function RTC(wsURL) {
        this.mediaConstraints = {
            audio: true,
            video: true // ...and we want a video track
        };
        this.peerConnections = {};
        this.signaling = new SignalingChannel_1.default(wsURL);
        this.signaling.delegate = this;
        this.eventEmitter = new eventemitter3_1.EventEmitter();
    }
    Object.defineProperty(RTC.prototype, "videoElement", {
        set: function (value) {
            this._videoElement = value;
        },
        enumerable: true,
        configurable: true
    });
    RTC.prototype.getMedia = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, navigator.mediaDevices.getUserMedia(this.mediaConstraints)];
            });
        });
    };
    RTC.prototype.getDisplay = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                // @ts-ignore
                return [2 /*return*/, navigator.mediaDevices.getDisplayMedia({ video: true })];
            });
        });
    };
    RTC.prototype.createPeerConnection = function () {
        try {
            var pc = new RTCPeerConnection(config);
            pc.onicecandidate = this.handleICECandidateEvent.bind(this);
            pc.ontrack = this.handleTrackEvent.bind(this);
            pc.onconnectionstatechange = this.handleConnectionStateChangeEvent.bind(this);
            pc.onsignalingstatechange = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return console.log('onsignalingstatechange', args);
            };
            pc.ondatachannel = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return console.log('ondatachannel', args);
            };
            pc.onnegotiationneeded = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return console.log('onnegotiationneeded', args);
            };
            console.log('Created RTCPeerConnnection');
            return pc;
        }
        catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            return;
        }
    };
    RTC.prototype.addTracks = function (peerConnection) {
        if (!this.localStream) {
            return;
        }
        for (var _i = 0, _a = this.localStream.getTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            peerConnection.addTrack(track);
        }
    };
    RTC.prototype.removeTracks = function (peerConnection) {
        for (var _i = 0, _a = peerConnection.getSenders(); _i < _a.length; _i++) {
            var sender = _a[_i];
            peerConnection.removeTrack(sender);
        }
    };
    // Called by the WebRTC layer to let us know when it's time to
    // begin (or restart) ICE negotiation. Starts by creating a WebRTC
    // offer, then sets it as the description of our local media
    // (which configures our local media stream), then sends the
    // description to the callee as an offer. This is a proposed media
    // format, codec, resolution, etc.
    RTC.prototype.createOffer = function (toId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pc, offer, e_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("createOffer to " + toId + " from " + this.id);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        pc = this.peerConnections[toId] || this.createPeerConnection();
                        this.removeTracks(pc);
                        this.addTracks(pc);
                        this.peerConnections[toId] = pc;
                        return [4 /*yield*/, pc.createOffer()];
                    case 2:
                        offer = _a.sent();
                        //2. Promise fulfilled: set the description of Caller’s end of the call by calling RTCPeerConnection.setLocalDescription()
                        return [4 /*yield*/, pc.setLocalDescription(offer)];
                    case 3:
                        //2. Promise fulfilled: set the description of Caller’s end of the call by calling RTCPeerConnection.setLocalDescription()
                        _a.sent();
                        //3. Promise fulfilled: send the offer through the signaling server to Callee in a message of type "rtc-offer"
                        this.signaling.sendMessage({
                            from: this.id,
                            type: RTCMessage_1.MessageType.RTC_OFFER,
                            sdp: pc.localDescription,
                            target: toId
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Accept an offer to video chat. We configure our local settings,
    // create our RTCPeerConnection, get and attach our local camera
    // stream, then create and send an answer to the caller.
    RTC.prototype.handleOfferMsg = function (msg) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var pc, desc, answer, e_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("GOT OFFER from " + msg.from + " to " + this.id);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        pc = this.peerConnections[msg.from] || this.createPeerConnection();
                        this.removeTracks(pc);
                        this.remoteStream = null;
                        this.peerConnections[msg.from] = pc;
                        desc = new RTCSessionDescription(msg.sdp);
                        // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
                        return [4 /*yield*/, pc.setRemoteDescription(desc)];
                    case 2:
                        // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
                        _a.sent();
                        return [4 /*yield*/, pc.createAnswer()];
                    case 3:
                        answer = _a.sent();
                        // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
                        return [4 /*yield*/, pc.setLocalDescription(answer)];
                    case 4:
                        // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
                        _a.sent();
                        console.log("CREATED ANSWER", answer);
                        // 8. Promise fulfilled: send the SDP answer through the signaling server to Caller in a message of type “rtc-answer”
                        // We've configured our end of the call now. Time to send our
                        // answer back to the caller so they know that we want to talk
                        // and how to talk to us.
                        this.signaling.sendMessage({
                            type: RTCMessage_1.MessageType.RTC_ANSWER,
                            sdp: pc.localDescription,
                            from: this.id,
                            target: msg.from
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, null];
                }
            });
        });
    };
    RTC.prototype.handleConnectionStateChangeEvent = function (event) {
        console.log('onconnectionstatechange', event);
        switch (event.target.connectionState) {
            case 'connected':
                this.eventEmitter.emit(STATE_EVENTS.CONNECTED);
                break;
            case 'disconnected':
            case 'failed':
                this.eventEmitter.emit(STATE_EVENTS.FAILED);
                break;
            case 'closed':
                this.eventEmitter.emit(STATE_EVENTS.CLOSED);
                break;
            default:
                break;
        }
    };
    ;
    // Responds to the MessageType.RTC_ANSWER message sent to the caller
    // once the callee has decided to accept our request to talk.
    RTC.prototype.handleAnswerMsg = function (msg) {
        //1. Create an RTCSessionDescription using the received SDP answer
        var desc = new RTCSessionDescription(msg.sdp);
        //2. Pass the session description to RTCPeerConnection.setRemoteDescription() to configure Caller’s WebRTC layer to
        //   know how Callee’s end of the connection is configured
        this.peerConnections[msg.from].setRemoteDescription(desc).catch(console.error);
    };
    // A new ICE candidate has been received from the other peer. Call
    // RTCPeerConnection.addIceCandidate() to send it along to the
    // local ICE framework.
    RTC.prototype.handleNewIceCandidateMsg = function (msg) {
        //1. Create an RTCIceCandidate object using the SDP provided in the candidate
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: msg.label,
            candidate: msg.candidate
        });
        console.log("Adding received ICE candidate: " + JSON.stringify(candidate));
        //2. Deliver the candidate to self ICE layer by passing it to RTCPeerConnection.addIceCandidate()
        if (this.peerConnections[msg.from]) {
            this.peerConnections[msg.from].addIceCandidate(candidate).catch(console.error);
        }
    };
    // Handles |icecandidate| events by forwarding the specified
    // ICE candidate (created by our local ICE agent) to the other
    // peer through the signaling server.
    RTC.prototype.handleICECandidateEvent = function (event) {
        //Receives the candidate and sends it to other client through the signaling server as a “candidate” message
        if (event.candidate) {
            var _a = event.candidate, sdpMLineIndex = _a.sdpMLineIndex, sdpMid = _a.sdpMid, candidate = _a.candidate;
            console.log('sending ICE candidate', event);
            this.signaling.sendMessage({
                from: this.id,
                type: RTCMessage_1.MessageType.CANDIDATE,
                label: sdpMLineIndex,
                id: sdpMid,
                candidate: candidate
            });
        }
        else {
            console.log('End of candidates.');
        }
    };
    // Called by the WebRTC layer when events occur on the media tracks
    // on our WebRTC call. This includes when streams are added to and
    // removed from the call.
    //
    // track events include the following fields:
    //
    // RTCRtpReceiver       receiver
    // MediaStreamTrack     track
    // MediaStream[]        streams
    // RTCRtpTransceiver    transceiver
    RTC.prototype.handleTrackEvent = function (event) {
        if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            this._videoElement['srcObject'] = this.remoteStream;
        }
        console.log('Track event:', event);
        this.remoteStream.addTrack(event.track);
    };
    RTC.prototype.handleNewUser = function (userId) {
        console.log(userId);
        this.createOffer(userId);
    };
    RTC.prototype.setId = function (id) {
        this.id = id;
    };
    RTC.prototype.join = function (room, isStreamer) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.signaling.setupSocket()];
                    case 1:
                        _a.sent();
                        this.signaling.sendMessage({
                            type: RTCMessage_1.MessageType.JOIN,
                            room: room,
                            isStreamer: isStreamer
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RTC.prototype.stop = function () {
        this.stopTracks();
        this.signaling.disconnect();
    };
    RTC.prototype.stopTracks = function () {
        for (var _i = 0, _a = this.localStream.getTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            track.stop();
        }
        this.signaling.disconnect();
    };
    RTC.prototype.mute = function () {
        for (var _i = 0, _a = this.localStream.getAudioTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            track.enabled = !track.enabled;
        }
    };
    RTC.prototype.disableVideo = function () {
        for (var _i = 0, _a = this.localStream.getVideoTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            track.enabled = !track.enabled;
        }
    };
    RTC.prototype.switchSource = function (type) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _i, _a, pcId;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('Switch source');
                        return [4 /*yield*/, this.setupVideo(type)];
                    case 1:
                        _b.sent();
                        for (_i = 0, _a = Object.keys(this.peerConnections); _i < _a.length; _i++) {
                            pcId = _a[_i];
                            this.createOffer(pcId);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RTC.prototype.setupVideo = function (type) {
        if (type === void 0) { type = 'webcam'; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stream, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(type == 'webcam')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getMedia()];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.getDisplay()];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        stream = _a;
                        this._videoElement['srcObject'] = stream;
                        this.localStream = stream;
                        return [2 /*return*/];
                }
            });
        });
    };
    RTC.prototype.on = function (event, fn, context) {
        return this.eventEmitter.on(event, fn, context);
    };
    RTC.prototype.off = function (event, fn, context, once) {
        return this.eventEmitter.off(event, fn, context, once);
    };
    RTC.prototype.destroy = function () {
        this.eventEmitter.removeAllListeners();
    };
    return RTC;
}());
exports.default = RTC;
//# sourceMappingURL=RTC.js.map