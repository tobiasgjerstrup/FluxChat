import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api, Channel } from '../../core/api';
import { Modal } from '../../shared/modal/modal';
import { CreateChannel } from './create-channel/create-channel';

@Component({
    selector: 'app-server',
    imports: [RouterLink, Modal, CreateChannel],
    templateUrl: './server.html',
    styleUrl: './server.scss',
})
export class Server {
    constructor(
        private api: Api,
        private route: ActivatedRoute,
    ) {
        this.serverId = Number(this.route.snapshot.paramMap.get('serverId'));
    }

    private serverId;

    public channels = signal<Channel[]>([]);
    public showCreateChannelModal = false;

    async ngOnInit() {
        try {
            if (!this.serverId) {
                console.error('Server ID is missing');
                return;
            }
            const channels = await this.api.getChannels(this.serverId);
            this.channels.set(channels);
        } catch (error) {
            console.error('Failed to load channels', error);
        }
    }

    public async closeCreateChannelModal() {
        this.showCreateChannelModal = false;

        const channels = await this.api.getChannels(this.serverId);
        this.channels.set(channels);
    }
}
