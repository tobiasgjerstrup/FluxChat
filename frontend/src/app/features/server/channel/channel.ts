import { Component } from '@angular/core';
import { Chat } from '../../../shared/chat/chat';

@Component({
    selector: 'app-channel',
    imports: [Chat],
    templateUrl: './channel.html',
    styleUrl: './channel.scss',
})
export class Channel {}
