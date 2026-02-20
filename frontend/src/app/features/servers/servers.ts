import { Component, signal } from '@angular/core';
import { Api, Server } from '../../core/api';
import { Modal } from '../../shared/modal/modal';
import { CreateServer } from './create-server/create-server';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-servers',
    imports: [Modal, CreateServer, RouterLink],
    templateUrl: './servers.html',
    styleUrl: './servers.scss',
})
export class Servers {
    constructor(private api: Api) {}

    public servers = signal<Server[]>([]);
    public showCreateServerModal = false;

    async ngOnInit() {
        try {
            const servers = await this.api.getServers();
            this.servers.set(servers);
        } catch (error) {
            console.error('Failed to load servers', error);
        }
    }

    public async closeCreateServerModal() {
        this.showCreateServerModal = false;

        const servers = await this.api.getServers();
        this.servers.set(servers);
    }
}
