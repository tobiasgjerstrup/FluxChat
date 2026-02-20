import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Api } from '../../../core/api';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-create-channel',
    imports: [FormsModule],
    templateUrl: './create-channel.html',
    styleUrl: './create-channel.scss',
})
export class CreateChannel {
    constructor(
        private api: Api,
        private route: ActivatedRoute,
    ) {
        this.serverId = Number(this.route.snapshot.paramMap.get('serverId'));
    }

    private serverId;

    @Output() createdChannel = new EventEmitter<void>();

    public channelName = '';

    public async createChannel() {
        try {
            if (!this.serverId) {
                console.error('Server ID is missing');
                return;
            }
            await this.api.createChannel(this.channelName, this.serverId);
            this.createdChannel.emit();
        } catch (error) {
            console.error('Failed to create channel', error);
        }
    }
}
