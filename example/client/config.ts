//Warning! These turn servers should NOT be used in production!
export const RTC_CONFIG: RTCConfiguration = {
    // 'iceServers': [
    //   {
    //     "urls": [
    //       "stun:64.233.165.127:19302",
    //       "stun:[2a00:1450:4010:c08::7f]:19302"
    //     ]
    //   },
    //   {
    //     "urls": [
    //       "turn:64.233.161.127:19305?transport=udp",
    //       "turn:[2a00:1450:4010:c01::7f]:19305?transport=udp",
    //       "turn:64.233.161.127:19305?transport=tcp",
    //       "turn:[2a00:1450:4010:c01::7f]:19305?transport=tcp"
    //     ],
    //     "username": "CNKsvOUFEgb5DoznbPYYzc/s6OMTIICjBQ",
    //     "credential": "hzb6Xi+YesoW1SZ6P70bo2OOWzk="
    //   }
    // ]
    "iceServers": [{ "urls": ["stun:64.233.161.127:19302", "stun:[2a00:1450:4010:c01::7f]:19302"] }, {
        "urls": ["turn:64.233.161.127:19305?transport=udp",
            "turn:[2a00:1450:4010:c01::7f]:19305?transport=udp",
            "turn:64.233.161.127:19305?transport=tcp",
            "turn:[2a00:1450:4010:c01::7f]:19305?transport=tcp"],
        "username": "CJX8yOUFEgb7amoM5/0Yzc/s6OMTIICjBQ",
        "credential": "55xsQhA4gKlqfpU7DIfcUyDGEHA=",
    }]
};
export const WS_SERVER_URL = window.location.origin;