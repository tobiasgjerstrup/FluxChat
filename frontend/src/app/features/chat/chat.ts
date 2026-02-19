import { Component, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, Message } from '../../core/api';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './chat.html',
    styleUrl: './chat.scss',
})
export class Chat implements AfterViewInit {
    constructor(private api: Api) {}

    @ViewChild('chatHistory', { static: true }) chatHistory!: ElementRef<HTMLDivElement>;

    messages = signal<Message[]>([]);
    newMessage = '';

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
        if (this.newMessage.trim()) {
            await this.api.postMessage(this.newMessage.trim());
            if (wasAtBottom) this.scrollToBottom();
            this.newMessage = '';
        }
    }

    async ngOnInit() {
        const messages = await this.api.getMessages();
        this.messages.set(messages);
        setTimeout(() => this.scrollToBottom());
    }

    ngAfterViewInit() {
        this.scrollToBottom();

        // Connect to WebSocket
        const ws = this.api.connectWebSocket();
        ws.onmessage = (event) => {
            try {
                const wasAtBottom = this.isUserAtBottom();
                const data = JSON.parse(event.data);
                // If the backend sends a single message object
                if (data && data.text && data.userId) {
                    this.messages.update((msgs) => [...msgs, data]);
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
}
