# Voice Chat Signaling API

The backend WebSocket server now supports signaling for WebRTC-based voice chat. Clients must use the following message types for signaling:

## 1. Register User

Clients must register their userId after connecting:

```json
{
    "type": "register",
    "userId": "<your-user-id>"
}
```

## 2. WebRTC Offer

Send an offer to another user:

```json
{
    "type": "webrtc-offer",
    "targetId": "<target-user-id>",
    "sdp": "<offer-sdp>"
}
```

## 3. WebRTC Answer

Send an answer to another user:

```json
{
    "type": "webrtc-answer",
    "targetId": "<target-user-id>",
    "sdp": "<answer-sdp>"
}
```

## 4. WebRTC ICE Candidate

Relay ICE candidates:

```json
{
    "type": "webrtc-ice-candidate",
    "targetId": "<target-user-id>",
    "candidate": {
        /* ICE candidate object */
    }
}
```

The backend will relay these messages to the intended target user if they are connected.
