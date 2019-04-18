"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var io = require("socket.io-client");
var RTCMessage_1 = require("./RTCMessage");
var SignalingChannel = /** @class */ (function () {
    function SignalingChannel(wsURL) {
        this.wsURL = wsURL;
    }
    Object.defineProperty(SignalingChannel.prototype, "_debug", {
        set: function (value) {
            this.__debug = value;
        },
        enumerable: true,
        configurable: true
    });
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
                _this.delegate.handleDisconnect(_this.id);
            });
            socket.on('message', function (msg) {
                switch (msg.type) {
                    case RTCMessage_1.MessageType.CANDIDATE:
                        _this.delegate.handleNewIceCandidateMsg(msg);
                        _this.log("CANDIDATE", msg);
                        break;
                    case RTCMessage_1.MessageType.RTC_ANSWER:
                        _this.delegate.handleAnswerMsg(msg);
                        _this.log("RTC_ANSWER", msg);
                        break;
                    case RTCMessage_1.MessageType.RTC_OFFER:
                        _this.delegate.handleOfferMsg(msg);
                        _this.log("RTC_OFFER", msg);
                        break;
                }
            });
            socket.on('other', function (ids) {
                _this.log('Other', ids);
                for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                    var id = ids_1[_i];
                    _this.delegate.handleNewUser(id);
                }
            });
            socket.on('me', function (id) {
                _this.id = id;
                _this.delegate.setId(id);
            });
            socket.on('user disconnect', function (id) {
                _this.delegate.handleDisconnect(id);
            });
            socket.on('error', function (error) {
                reject(error);
            });
        });
    };
    SignalingChannel.prototype.sendMessage = function (msg) {
        this.log('Client sending message: ', msg);
        this.socket.emit('message', msg);
    };
    SignalingChannel.prototype.disconnect = function () {
        this.socket.disconnect();
    };
    SignalingChannel.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.__debug) {
            console.log.apply(console, args);
        }
    };
    return SignalingChannel;
}());
exports.default = SignalingChannel;
//# sourceMappingURL=SignalingChannel.js.map