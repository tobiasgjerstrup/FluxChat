import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, Message } from '../../../../core/api';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { url } from 'inspector';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './chat.html',
    styleUrl: './chat.scss',
})
export class Chat implements AfterViewInit, OnDestroy {
    private routeSub: Subscription | undefined;
    private ws: WebSocket | undefined;

    constructor(
        private api: Api,
        private route: ActivatedRoute,
        private sanitizer: DomSanitizer,
    ) {}

    @ViewChild('chatHistory', { static: true }) chatHistory!: ElementRef<HTMLDivElement>;

    private channelId: number = 0;
    messages = signal<Message[]>([]);
    newMessage = signal('');

    private isUserAtBottom(): boolean {
        const el = this.chatHistory.nativeElement;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 5;
    }

    private scrollToBottom(): void {
        const el = this.chatHistory.nativeElement;
        el.scrollTop = el.scrollHeight;
    }

    async sendMessage() {
        const wasAtBottom = this.isUserAtBottom();
        if (this.newMessage().trim()) {
            await this.api.postMessage(this.newMessage().trim(), this.channelId);
            if (wasAtBottom) this.scrollToBottom();
            this.newMessage.set('');
        }
    }

    async ngOnInit() {
        this.routeSub = this.route.paramMap.subscribe(async (params) => {
            const newChannelId = Number(params.get('channelId'));
            if (this.channelId !== newChannelId) {
                this.channelId = newChannelId;
                const messages = await this.api.getMessages(this.channelId);
                this.messages.set(messages);
                setTimeout(() => this.scrollToBottom());
            }
        });
    }

    ngOnDestroy() {
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
        if (this.ws) {
            this.ws.close();
        }
    }

    ngAfterViewInit() {
        this.scrollToBottom();

        // Connect to WebSocket
        this.ws = this.api.connectWebSocket();
        this.ws.onmessage = (event) => {
            try {
                const wasAtBottom = this.isUserAtBottom();
                const data = JSON.parse(event.data);
                // If the backend sends a single message object
                if (data && data.content && data.author_id && data.channel_id === this.channelId) {
                    this.messages.update((msgs) => [...msgs, data]);
                    console.log('Received new message via WebSocket:', data);
                    if (wasAtBottom) {
                        setTimeout(() => this.scrollToBottom());
                    }
                }
                // If the backend sends an array of messages
                if (Array.isArray(data)) {
                    this.messages.set(data);
                    if (wasAtBottom) {
                        setTimeout(() => this.scrollToBottom());
                    }
                }
            } catch (e) {
                // Ignore non-JSON or unexpected messages
            }
        };
    }

    linkify(text: string): SafeHtml {
        if (!text) return '';
        const urlRegex = /((https?:\/\/|www\.)[^\s]+)/g;
        const replace = text.replace(urlRegex, (url) => {
            let href = url;
            if (!href.startsWith('http')) {
                href = 'http://' + href;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        return this.sanitizer.bypassSecurityTrustHtml(replace);
    }
}
