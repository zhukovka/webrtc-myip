"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var io = require("socket.io-client");
var RTCMessage_1 = require("./RTCMessage");
var SignalingChannel = /** @class */ (function () {
    function SignalingChannel(wsURL) {
        this.wsURL = wsURL;
    }
    SignalingChannel.prototype.setupSocket = function () {
        var _this = this;
        var socket = io(this.wsURL);
        this.socket = socket;
        return new Promise(function (resolve, reject) {
            socket.on('connect', function () {
                resolve();
            });
            socket.on('disconnect', function (reason) {
                if (reason === 'io server disconnect') {
                    // the disconnection was initiated by the server, you need to reconnect manually
                    socket.connect();
                }
                // else the socket will automatically try to reconnect
                //TODO: handle reconnection
            });
            socket.on('message', function (msg) {
                switch (msg.type) {
                    case RTCMessage_1.MessageType.CANDIDATE:
                        _this.delegate.handleNewIceCandidateMsg(msg);
                        break;
                    case RTCMessage_1.MessageType.RTC_ANSWER:
                        _this.delegate.handleAnswerMsg(msg);
                        break;
                    case RTCMessage_1.MessageType.RTC_OFFER:
                        _this.delegate.handleOfferMsg(msg);
                        break;
                }
            });
            socket.on('other', function (ids) {
                console.log('Other', ids);
                for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                    var id = ids_1[_i];
                    _this.delegate.handleNewUser(id);
                }
            });
            socket.on('me', function (id) {
                _this.delegate.setId(id);
            });
        });
    };
    SignalingChannel.prototype.sendMessage = function (msg) {
        console.log('Client sending message: ', msg);
        this.socket.emit('message', msg);
    };
    SignalingChannel.prototype.disconnect = function () {
        this.socket.disconnect();
    };
    return SignalingChannel;
}());
exports.default = SignalingChannel;
//# sourceMappingURL=SignalingChannel.js.map