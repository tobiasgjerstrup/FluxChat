import { Injectable } from '@angular/core';

const ws = 'wss://tboss.dev/api/v1'; // ws://127.0.0.1:3001

@Injectable({ providedIn: 'root' })
export class VoicechatService {
    // Helper to set Opus maxaveragebitrate in SDP
    private setOpusBitrate(sdp: string, bitrate: number): string {
        return sdp.replace(/a=fmtp:(\d+) (.*)\r?\n/g, (line, p1, p2) => {
            if (line.includes('opus')) {
                if (p2.includes('maxaveragebitrate')) {
                    return `a=fmtp:${p1} ${p2.replace(/maxaveragebitrate=\d+/, `maxaveragebitrate=${bitrate}`)}\r\n`;
                } else {
                    return `a=fmtp:${p1} ${p2};maxaveragebitrate=${bitrate}\r\n`;
                }
            }
            return line;
        });
    }
    private ws: any = null;
    private peerConnection: any = null;
    private localStream: any = null;
    private remoteStream: any = null;
    private userId: string | null = null;

    connectWebSocket(userId: string) {
        if (typeof window === 'undefined') return;
        this.userId = userId;
        this.ws = new window.WebSocket(`${ws}/`);
        this.ws.onopen = () => {
            this.send({ type: 'register', userId });
        };
        this.ws.onmessage = (event: any) => {
            const message = JSON.parse(event.data);
            this.handleSignalingMessage(message);
        };
    }

    private pendingCandidates: RTCIceCandidateInit[] = [];
    private currentPeerId: string | null = null;
    private send(msg: any) {
        if (typeof window === 'undefined') return;
        // Only set targetId to currentPeerId for answers and ICE candidates sent by the callee
        if ((msg.type === 'webrtc-answer' || msg.type === 'webrtc-ice-candidate') && this.currentPeerId) {
            msg.targetId = this.currentPeerId;
        }
        // Offers and caller ICE candidates use the explicit targetId
        console.log('Sending signaling message:', msg);
        if (this.ws && this.ws.readyState === window.WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    async startCall(targetId: string, iceServers: any[]) {
        if (
            typeof window === 'undefined' ||
            !window.navigator ||
            !window.navigator.mediaDevices ||
            !window.navigator.mediaDevices.getUserMedia
        ) {
            console.warn('getUserMedia is not available in this environment.');
            return;
        }
        this.peerConnection = this.createPeerConnection(targetId, iceServers);
        this.localStream = await window.navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });
        this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
            this.peerConnection.addTrack(track, this.localStream);
            console.log(
                '[VoiceChat] Added local track to peerConnection:',
                track,
                'enabled:',
                track.enabled,
                'muted:',
                track.muted,
                'label:',
                track.label,
            );
        });
        let offer = await this.peerConnection.createOffer();
        offer.sdp = this.setOpusBitrate(offer.sdp, 128000);
        await this.peerConnection.setLocalDescription(offer);
        this.send({ type: 'webrtc-offer', targetId, userId: this.userId, sdp: offer.sdp, iceServers });
    }

    private createPeerConnection(targetId: string, iceServers: any[]): any {
        if (typeof window === 'undefined') return null;
        if (!iceServers || !iceServers.length) {
            throw new Error('ICE servers must be provided by the user.');
        }
        const pc = new window.RTCPeerConnection({
            iceServers: iceServers,
        });
        pc.onicecandidate = (event: any) => {
            if (event.candidate) {
                this.send({ type: 'webrtc-ice-candidate', targetId, candidate: event.candidate });
            }
        };
        pc.ontrack = (event: any) => {
            if (!this.remoteStream) {
                this.remoteStream = new window.MediaStream();
            }
            this.remoteStream.addTrack(event.track);
            console.log(
                '[VoiceChat] ontrack: Added remote track:',
                event.track,
                'enabled:',
                event.track.enabled,
                'muted:',
                event.track.muted,
                'label:',
                event.track.label,
                'STREAM:',
                this.remoteStream,
            );
            event.track.onmute = () => console.log('[VoiceChat] Remote track muted:', event.track);
            event.track.onunmute = () => console.log('[VoiceChat] Remote track unmuted:', event.track);
            event.track.onended = () => console.log('[VoiceChat] Remote track ended:', event.track);
        };
        pc.onconnectionstatechange = () => {
            console.log('[VoiceChat] PeerConnection state:', pc.connectionState);
        };
        pc.oniceconnectionstatechange = () => {
            console.log('[VoiceChat] ICE Connection state:', pc.iceConnectionState);
        };
        return pc;
    }

    private async handleSignalingMessage(message: any) {
        if (typeof window === 'undefined') return;
        console.log('Received signaling message:', message); // <-- log incoming
        switch (message.type) {
            case 'webrtc-offer':
                await this.handleOffer(message);
                break;
            case 'webrtc-answer':
                await this.handleAnswer(message);
                break;
            case 'webrtc-ice-candidate':
                await this.handleIceCandidate(message);
                break;
        }
    }

    private async handleOffer(message: any) {
        if (typeof window === 'undefined') return;
        const { sdp, userId: callerId, targetId, iceServers } = message;
        // Always set currentPeerId to the caller's userId (the offer sender)
        this.currentPeerId = callerId;
        if (!iceServers || !iceServers.length) {
            throw new Error('ICE servers must be provided by the user (from offer message).');
        }
        this.peerConnection = this.createPeerConnection(this.currentPeerId || '', iceServers);
        if (
            typeof window === 'undefined' ||
            !window.navigator ||
            !window.navigator.mediaDevices ||
            !window.navigator.mediaDevices.getUserMedia
        ) {
            console.warn('getUserMedia is not available in this environment.');
            return;
        }
        this.localStream = await window.navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });
        if (!this.localStream || !this.localStream.getAudioTracks().length) {
            console.warn('[VoiceChat] Callee: No local audio tracks available before answering!');
        } else {
            this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
                this.peerConnection.addTrack(track, this.localStream);
                console.log(
                    '[VoiceChat] Callee: Added local track to peerConnection:',
                    track,
                    'enabled:',
                    track.enabled,
                    'muted:',
                    track.muted,
                    'label:',
                    track.label,
                );
            });
        }
        await this.peerConnection.setRemoteDescription({ type: 'offer', sdp });
        // Add any buffered ICE candidates
        for (const candidate of this.pendingCandidates) {
            await this.peerConnection.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
        let answer = await this.peerConnection.createAnswer();
        // Set Opus maxaveragebitrate to 128kbps (128000)
        answer.sdp = this.setOpusBitrate(answer.sdp, 128000);
        await this.peerConnection.setLocalDescription(answer);
        this.send({ type: 'webrtc-answer', sdp: answer.sdp });
    }

    private async handleAnswer(message: any) {
        if (typeof window === 'undefined') return;
        const { sdp } = message;
        if (this.peerConnection) {
            console.log('[VoiceChat] Caller: Setting remote description with answer SDP:', sdp);
            await this.peerConnection.setRemoteDescription({ type: 'answer', sdp });
        }
    }

    private async handleIceCandidate(message: any) {
        if (typeof window === 'undefined') return;
        const { candidate } = message;
        if (this.peerConnection && candidate) {
            if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                await this.peerConnection.addIceCandidate(candidate);
            } else {
                this.pendingCandidates.push(candidate);
            }
        }
    }

    getLocalStream(): any {
        if (typeof window === 'undefined') return null;
        return this.localStream;
    }

    getRemoteStream(): any {
        if (typeof window === 'undefined') return null;
        return this.remoteStream;
    }
}
