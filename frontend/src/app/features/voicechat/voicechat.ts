import { Component, ElementRef, ViewChild, AfterViewInit, Inject } from '@angular/core';
import { VoicechatService } from './voicechat.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-voicechat',
  imports: [],
  templateUrl: './voicechat.html',
  styleUrl: './voicechat.scss',
})
export class Voicechat implements AfterViewInit {
  @ViewChild('localAudio', { static: false }) localAudioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio', { static: false }) remoteAudioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteCanvas', { static: false }) remoteCanvasRef!: ElementRef<HTMLCanvasElement>;
  targetId: string = '';
  userId: string = '';

  public playTestTone() {
    if (this.remoteCanvasRef && this.remoteCanvasRef.nativeElement && window.AudioContext) {
      const audioCtx = new window.AudioContext();
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      oscillator.connect(analyser);
      analyser.connect(audioCtx.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 1000);
      // Visualizer
      const canvas = this.remoteCanvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      function draw() {
        if (!ctx) return;
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0f0';
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
      draw();
    }
  }

  constructor(
    private voicechatService: VoicechatService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    // Bind audio streams to audio elements
    setTimeout(() => {
      const localStream = this.voicechatService.getLocalStream();
      if (localStream && this.localAudioRef) {
        this.localAudioRef.nativeElement.srcObject = localStream;
      }
    }, 0);

    // Poll for remote stream and bind when available
    const pollInterval = setInterval(() => {
      const remoteStream = this.voicechatService.getRemoteStream();
      if (remoteStream && this.remoteAudioRef) {
        const audioElem = this.remoteAudioRef.nativeElement;
        audioElem.srcObject = remoteStream;
        audioElem.muted = false;
        audioElem.volume = 1;
        audioElem.autoplay = true;
        // Try to trigger playback
        audioElem.play().then(() => {
          console.log('Remote audio playback started');
        }).catch((err) => {
          console.warn('Remote audio playback error:', err);
        });
        const tracks = (remoteStream instanceof MediaStream) ? remoteStream.getAudioTracks() : [];
        if (tracks.length) {
          console.log('Remote Stream (set):', remoteStream, 'Audio Tracks:', tracks, 'Audio Element:', {
            muted: audioElem.muted,
            volume: audioElem.volume,
            autoplay: audioElem.autoplay,
            readyState: audioElem.readyState
          });
          // Start audio visualizer
          if (this.remoteCanvasRef && window.AudioContext) {
            const canvas = this.remoteCanvasRef.nativeElement;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.warn('Could not get 2D context for remote audio visualizer');
              return;
            }
            const audioCtx = new window.AudioContext();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            const source = audioCtx.createMediaStreamSource(remoteStream);
            source.connect(analyser);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            function draw() {
              if (!ctx) return; // TypeScript: ctx is not null here
              requestAnimationFrame(draw);
              analyser.getByteTimeDomainData(dataArray);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.strokeStyle = '#0f0';
              ctx.beginPath();
              const sliceWidth = canvas.width / bufferLength;
              let x = 0;
              for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
                x += sliceWidth;
              }
              ctx.lineTo(canvas.width, canvas.height / 2);
              ctx.stroke();
            }
            draw();
          }
        } else {
          console.warn('Remote stream attached but has NO audio tracks:', remoteStream);
        }
        clearInterval(pollInterval);
      } else {
        if (this.remoteAudioRef) {
          const audioElem = this.remoteAudioRef.nativeElement;
          if (audioElem.srcObject && audioElem.srcObject instanceof MediaStream) {
            const tracks = audioElem.srcObject.getAudioTracks();
            console.warn('Audio element srcObject present but NO audio tracks:', tracks);
          }
        }
        console.log('Remote Stream (waiting):', remoteStream);
      }
    }, 500);
  }

  connect(userId: string) {
    console.log(userId, isPlatformBrowser(this.platformId))
    if (userId && isPlatformBrowser(this.platformId)) {
      this.voicechatService.connectWebSocket(userId);
    }
  }

  startCall(targetId: string) {
    this.voicechatService.startCall(targetId);
  }
}
