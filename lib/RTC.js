"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var RTCMessage_1 = require("./RTCMessage");
var SignalingChannel_1 = require("./SignalingChannel");
// @ts-ignore
var webrtc_adapter_1 = require("webrtc-adapter");
var EventEmitter = require("eventemitter3");
if (!webrtc_adapter_1.default) {
    // unused import hack
}
var CLIENT_EVENTS;
(function (CLIENT_EVENTS) {
    CLIENT_EVENTS["COUNT_CHANGED"] = "clientsCountChanged";
    CLIENT_EVENTS["NEW_CLIENT"] = "newClientConnected";
})(CLIENT_EVENTS = exports.CLIENT_EVENTS || (exports.CLIENT_EVENTS = {}));
var STREAM_EVENTS;
(function (STREAM_EVENTS) {
    STREAM_EVENTS["REMOTE_USER_MEDIA"] = "remoteUserMedia";
    STREAM_EVENTS["REMOTE_DISPLAY"] = "remoteDisplay";
})(STREAM_EVENTS = exports.STREAM_EVENTS || (exports.STREAM_EVENTS = {}));
var RTC = /** @class */ (function () {
    /**
     * Creates WebRTC client instance
     * example:
     * ```
     * const WS_SERVER_URL = window.location.origin;
     * const RTC_CONFIG = { 'iceServers': [ { "urls": [ "stun:64.233.165.127:19302" ] }]};
     * const rtc = new RTC(WS_SERVER_URL, RTC_CONFIG);
     * ```
     * @param wsURL
     * @param config
     */
    function RTC(wsURL, config) {
        this.config = config;
        this.sourceStream = {};
        this.destStream = {};
        this.peerConnections = {};
        this.signaling = new SignalingChannel_1.default(wsURL);
        this.signaling.delegate = this;
        this.connectionsCount = 0;
        this.eventEmitter = new EventEmitter();
    }
    Object.defineProperty(RTC.prototype, "_debug", {
        set: function (value) {
            this.__debug = value;
            this.signaling._debug = !!this.__debug;
        },
        enumerable: true,
        configurable: true
    });
    RTC.prototype.getMedia = function (constraints) {
        if (constraints === void 0) { constraints = { audio: true, video: true }; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, navigator.mediaDevices.getUserMedia(constraints)];
            });
        });
    };
    RTC.prototype.getDisplay = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // @ts-ignore
                return [2 /*return*/, navigator.mediaDevices.getDisplayMedia({ video: true })];
            });
        });
    };
    /**
     *
     * @param mediaType
     */
    RTC.prototype.createPeerConnection = function (mediaType) {
        var _this = this;
        try {
            var pc_1 = new RTCPeerConnection(this.config);
            // Handles |icecandidate| events by forwarding the specified
            // ICE candidate (created by our local ICE agent) to the other
            // peer through the signaling server.
            pc_1.onicecandidate = function (event) {
                _this.log('sending ICE candidate', event);
                return _this.handleCandidate(event.candidate, mediaType);
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
            pc_1.ontrack = function (event) {
                _this.log("Track event for " + mediaType, event);
                _this.handleSourceTrack(event.track, mediaType);
            };
            pc_1.onconnectionstatechange = function (event) {
                _this.log(event.type, pc_1.connectionState, _this.id, event);
                _this.handleConnectionStateChangeEvent(pc_1, mediaType);
            };
            pc_1.onsignalingstatechange = function (event) {
                _this.log(event.type, pc_1.signalingState, _this.id, event);
                _this.handleConnectionStateChangeEvent(pc_1, mediaType);
            };
            pc_1.ondatachannel = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.log('ondatachannel', args);
            };
            pc_1.onnegotiationneeded = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.log('onnegotiationneeded', args);
            };
            this.log('Created RTCPeerConnnection');
            return pc_1;
        }
        catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            return;
        }
    };
    RTC.prototype.handleConnectionStateChangeEvent = function (pc, mediaType) {
        switch (pc.connectionState) {
            case 'connected':
                break;
            case 'failed':
                break;
            case 'closed':
            case 'disconnected':
                this.handlePeerDisconnected(pc, mediaType);
                break;
            default:
                break;
        }
    };
    ;
    RTC.prototype.addTracksToPC = function (peerConnection, stream) {
        if (!stream) {
            return;
        }
        for (var _i = 0, _a = stream.getTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            peerConnection.addTrack(track);
        }
    };
    RTC.prototype.removeTracksFromPC = function (peerConnection) {
        for (var _i = 0, _a = peerConnection.getSenders(); _i < _a.length; _i++) {
            var sender = _a[_i];
            peerConnection.removeTrack(sender);
        }
    };
    RTC.prototype.getOrCreatePeerConnection = function (mediaType, userId) {
        var peerConnection = this.peerConnections[mediaType] || (this.peerConnections[mediaType] = {});
        var pc = peerConnection[userId] || this.createPeerConnection(mediaType);
        peerConnection[userId] = pc;
        return pc;
    };
    // Called by the WebRTC layer to let us know when it's time to
    // begin (or restart) ICE negotiation. Starts by creating a WebRTC
    // offer, then sets it as the description of our local media
    // (which configures our local media stream), then sends the
    // description to the callee as an offer. This is a proposed media
    // format, codec, resolution, etc.
    RTC.prototype.createOffer = function (mediaType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var pc, offer, msg, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userId) {
                            throw new Error('No User ID.');
                        }
                        console.log("createOffer to " + userId + " from " + this.id);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        pc = this.getOrCreatePeerConnection(mediaType, userId);
                        this.removeTracksFromPC(pc);
                        this.addTracksToPC(pc, this.sourceStream[mediaType]);
                        return [4 /*yield*/, pc.createOffer()];
                    case 2:
                        offer = _a.sent();
                        //2. Promise fulfilled: set the description of Caller’s end of the call by calling RTCPeerConnection.setLocalDescription()
                        return [4 /*yield*/, pc.setLocalDescription(offer)];
                    case 3:
                        //2. Promise fulfilled: set the description of Caller’s end of the call by calling RTCPeerConnection.setLocalDescription()
                        _a.sent();
                        msg = {
                            mediaType: mediaType,
                            from: this.id,
                            type: RTCMessage_1.MessageType.RTC_OFFER,
                            sdp: pc.localDescription,
                            target: userId
                        };
                        this.signaling.sendMessage(msg);
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
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * Accept an offer to video chat. We configure our local settings,
     * create our RTCPeerConnection, get and attach our local camera
     * stream, then create and send an answer to the caller.
     * @param msg
     */
    RTC.prototype.handleOfferMsg = function (_a) {
        var mediaType = _a.mediaType, sdp = _a.sdp, from = _a.from;
        return __awaiter(this, void 0, void 0, function () {
            var pc, desc, answer, answerMsg, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.log("GOT OFFER from " + from + " to " + this.id);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        pc = this.getOrCreatePeerConnection(mediaType, from);
                        this.removeTracksFromPC(pc);
                        if (this.__isStreamer) {
                            this.addTracksToPC(pc, this.sourceStream[mediaType]);
                        }
                        this.destStream[mediaType] = null;
                        desc = new RTCSessionDescription(sdp);
                        // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
                        return [4 /*yield*/, pc.setRemoteDescription(desc)];
                    case 2:
                        // 3. Call RTCPeerConnection.setRemoteDescription() to tell WebRTC about Caller’s configuration.
                        _b.sent();
                        return [4 /*yield*/, pc.createAnswer()];
                    case 3:
                        answer = _b.sent();
                        // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
                        return [4 /*yield*/, pc.setLocalDescription(answer)];
                    case 4:
                        // 7. Promise fulfilled: configure Callee’s end of the connection by match the generated answer by calling RTCPeerConnection.setLocalDescription()
                        _b.sent();
                        this.log("CREATED ANSWER", answer);
                        answerMsg = {
                            mediaType: mediaType,
                            type: RTCMessage_1.MessageType.RTC_ANSWER,
                            sdp: pc.localDescription,
                            from: this.id,
                            target: from
                        };
                        this.signaling.sendMessage(answerMsg);
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _b.sent();
                        console.error(e_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link NegotiationMessage}
     * meaning an answer to the Presenter's offer has been received.
     * Responds to the message sent to the caller
     * once the callee has decided to accept the request to talk.
     *
     * @param msg
     */
    RTC.prototype.handleAnswerMsg = function (_a) {
        var sdp = _a.sdp, from = _a.from, mediaType = _a.mediaType;
        //1. Create an RTCSessionDescription using the received SDP answer
        var desc = new RTCSessionDescription(sdp);
        //2. Pass the session description to RTCPeerConnection.setRemoteDescription() to configure Caller’s WebRTC layer to
        //   know how Callee’s end of the connection is configured
        var pc = this.peerConnections[mediaType][from];
        pc.setRemoteDescription(desc).catch(console.error);
    };
    /**
     * {@link SignalingDelegate} method to handle socket message of type {@link ICECandidateMessage}
     * meaning a new ICE candidate has been received from the other peer.
     *
     * @param sdpMLineIndex
     * @param sdpMid
     * @param candidate
     * @param from
     * @param mediaType
     */
    RTC.prototype.handleNewIceCandidateMsg = function (_a) {
        var sdpMLineIndex = _a.sdpMLineIndex, sdpMid = _a.sdpMid, candidate = _a.candidate, from = _a.from, mediaType = _a.mediaType;
        //1. Create an RTCIceCandidate object using the SDP provided in the ICECandidateMessage
        var ice = new RTCIceCandidate({
            sdpMLineIndex: sdpMLineIndex,
            candidate: candidate
        });
        //2. Deliver the candidate to self ICE layer by passing it to RTCPeerConnection.addIceCandidate()
        if (this.peerConnections[mediaType] && this.peerConnections[mediaType][from]) {
            this.peerConnections[mediaType][from].addIceCandidate(ice).catch(console.error);
        }
        this.log("Adding received ICE candidate: " + JSON.stringify(ice), "Of type " + mediaType);
    };
    RTC.prototype.handleCandidate = function (iceCandidate, mediaType) {
        if (iceCandidate) {
            var sdpMLineIndex = iceCandidate.sdpMLineIndex, sdpMid = iceCandidate.sdpMid, candidate = iceCandidate.candidate;
            var msg = {
                from: this.id,
                type: RTCMessage_1.MessageType.CANDIDATE,
                sdpMLineIndex: sdpMLineIndex,
                sdpMid: sdpMid,
                candidate: candidate,
                mediaType: mediaType
            };
            this.signaling.sendMessage(msg);
        }
        else {
            this.log('End of candidates.');
        }
    };
    RTC.prototype.handleSourceTrack = function (track, mediaType) {
        var stream = this.destStream[mediaType] || new MediaStream();
        this.destStream[mediaType] = stream;
        stream.addTrack(track);
        var eventType = (mediaType == 'userMedia') ? STREAM_EVENTS.REMOTE_USER_MEDIA : STREAM_EVENTS.REMOTE_DISPLAY;
        this.eventEmitter.emit(eventType, stream);
    };
    /**
     * {@link SignalingDelegate} method to handle socket event 'other' (other user joined)
     * @param userId
     */
    RTC.prototype.handleNewUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, mediaType;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.log(userId);
                        this.connectionsCount++;
                        this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
                        _i = 0, _a = Object.keys(this.sourceStream);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        mediaType = _a[_i];
                        return [4 /*yield*/, this.createOffer(mediaType, userId)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'me' (this user joined)
     * @param id
     */
    RTC.prototype.setId = function (id) {
        this.id = id;
    };
    /**
     * Sends {@link JoinMessage} message to the websocket.
     * Returns a promise that resolves on the socket connection and rejects on the socket error
     *
     * Example:
     * ```
     * const room = '123';
     * const isStreamer = true;
     * rtc.join(room, isStreamer);
     * ```
     * @param room
     * @param isStreamer
     */
    RTC.prototype.join = function (room, isStreamer) {
        return __awaiter(this, void 0, void 0, function () {
            var msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('join', room, isStreamer);
                        this.__isStreamer = isStreamer;
                        return [4 /*yield*/, this.signaling.setupSocket()];
                    case 1:
                        _a.sent();
                        msg = {
                            type: RTCMessage_1.MessageType.JOIN,
                            room: room,
                            isStreamer: isStreamer
                        };
                        this.signaling.sendMessage(msg);
                        return [2 /*return*/, this.eventEmitter];
                }
            });
        });
    };
    /**
     * Stops streams and disconnects from the socket server
     */
    RTC.prototype.stop = function () {
        for (var _i = 0, _a = Object.values(this.sourceStream); _i < _a.length; _i++) {
            var stream = _a[_i];
            this.stopTracks(stream.getTracks());
        }
        this.signaling.disconnect();
    };
    RTC.prototype.stopTracks = function (tracks) {
        for (var _i = 0, tracks_1 = tracks; _i < tracks_1.length; _i++) {
            var track = tracks_1[_i];
            track.stop();
        }
    };
    /**
     * Toggles muted state of a user's audio
     */
    RTC.prototype.mute = function () {
        if (this.sourceStream.userMedia) {
            this.enableTracks(this.sourceStream.userMedia.getAudioTracks());
        }
    };
    RTC.prototype.enableTracks = function (tracks) {
        for (var _i = 0, tracks_2 = tracks; _i < tracks_2.length; _i++) {
            var track = tracks_2[_i];
            track.enabled = !track.enabled;
        }
    };
    /**
     * Toggles enabled state of a user's media (webcam)
     */
    RTC.prototype.disableVideo = function () {
        if (this.sourceStream.userMedia) {
            this.enableTracks(this.sourceStream.userMedia.getVideoTracks());
        }
    };
    /**
     * Sets the Presenter's stream source from either webcam or display and related HTMLVideoElement.
     * It returns a Promise that resolves to a MediaStream object. If the user denies permission,
     * or matching media is not available, then the promise is rejected with NotAllowedError or NotFoundError respectively.
     *
     * Example:
     * ```
     * const mediaType = 'userMedia';
     * const userMedia = document.getElementById("userMedia");
     * rtc.setupMedia('userMedia', userMedia);
     * ```
     * @param type
     * @param mediaConstraints - optional parameter. Defaults to `{ audio: true, video: true }` for user media (webcam)
     * and is *NOT* configurable for screen sharing as audio is not supported https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
     */
    RTC.prototype.setupMedia = function (type, mediaConstraints) {
        if (type === void 0) { type = 'userMedia'; }
        return __awaiter(this, void 0, void 0, function () {
            var stream, _a, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        if (!(type == 'userMedia')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getMedia(mediaConstraints)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.getDisplay()];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        stream = _a;
                        this.sourceStream[type] = stream;
                        return [2 /*return*/, stream];
                    case 5:
                        e_3 = _b.sent();
                        throw e_3;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Closes PeerConnection of the specified {@link MediaType} on Presenter's side.
     * Removes media stream from the video element it is attached to.
     * @param type
     */
    RTC.prototype.removeConnectionType = function (type) {
        if (type === void 0) { type = 'userMedia'; }
        //stop tracks from source video
        var stream = this.sourceStream[type];
        stream && this.stopTracks(stream.getTracks());
        delete this.sourceStream[type];
        //close all connections of the type
        for (var _i = 0, _a = Object.keys(this.peerConnections[type]); _i < _a.length; _i++) {
            var pcId = _a[_i];
            this.log("close connection with " + pcId);
            this.peerConnections[type][pcId].close();
            delete this.peerConnections[type][pcId];
        }
    };
    /**
     * Opens PeerConnection of the specified {@link MediaType} on Presenter's side.
     * @param type
     */
    RTC.prototype.addConnectionType = function (type) {
        if (type === void 0) { type = 'userMedia'; }
        var existingType = type == 'userMedia' ? 'displayMedia' : 'userMedia';
        //invite all viewers of the existing media to a stream of a new type
        for (var _i = 0, _a = Object.keys(this.peerConnections[existingType]); _i < _a.length; _i++) {
            var peerId = _a[_i];
            this.createOffer(type, peerId).catch(console.error);
        }
    };
    /**
     * {@link SignalingDelegate} method to handle socket event of type 'disconnect'.
     * @param userId
     */
    RTC.prototype.handleDisconnect = function (userId) {
        if (userId == this.id) { // this user disconnected -> close all connections
            this.closeAllConnections();
            this.connectionsCount = 0;
        }
        else { // other user disconnected -> close client connection
            this.closeConnection(userId);
            this.connectionsCount--;
        }
        this.log("Connections count " + this.connectionsCount);
        this.eventEmitter.emit(CLIENT_EVENTS.COUNT_CHANGED, this.connectionsCount);
    };
    RTC.prototype.closeConnection = function (userId) {
        for (var _i = 0, _a = Object.keys(this.peerConnections); _i < _a.length; _i++) {
            var type = _a[_i];
            var peerConnection = this.peerConnections[type];
            var pc = peerConnection[userId];
            pc && pc.close();
            delete peerConnection[userId];
        }
    };
    RTC.prototype.closeAllConnections = function () {
        //reduce peer connections map to peer connections array
        var allPC = Object.values(this.peerConnections).reduce(function (arr, obj) { return arr.concat(Object.values(obj)); }, []);
        for (var _i = 0, allPC_1 = allPC; _i < allPC_1.length; _i++) {
            var pc = allPC_1[_i];
            pc.close();
        }
    };
    RTC.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.__debug) {
            console.log.apply(console, args);
        }
        if (this.__debug == 'trace') {
            console.groupCollapsed('trace');
            console.trace();
            console.groupEnd();
        }
    };
    RTC.prototype.startScreenSharing = function () {
        return __awaiter(this, void 0, void 0, function () {
            var media;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setupMedia('displayMedia')];
                    case 1:
                        media = _a.sent();
                        this.addConnectionType('displayMedia');
                        return [2 /*return*/, media];
                }
            });
        });
    };
    RTC.prototype.stopScreenSharing = function () {
        this.removeConnectionType('displayMedia');
    };
    RTC.prototype.handlePeerDisconnected = function (pc, mediaType) {
        this.destStream[mediaType] = null;
        for (var _i = 0, _a = Object.keys(this.peerConnections[mediaType]); _i < _a.length; _i++) {
            var peerId = _a[_i];
            if (this.peerConnections[mediaType][peerId] == pc) {
                this.log("delete " + mediaType + " connection with " + peerId);
                this.peerConnections[mediaType][peerId] = null;
                delete this.peerConnections[mediaType][peerId];
            }
        }
        this.eventEmitter.emit((mediaType == 'userMedia') ? STREAM_EVENTS.REMOTE_USER_MEDIA : STREAM_EVENTS.REMOTE_DISPLAY, null);
    };
    return RTC;
}());
exports.default = RTC;
//# sourceMappingURL=RTC.js.map