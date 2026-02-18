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

    ngOnInit() {
        this.api.getServers().subscribe((servers) => {
            this.servers.set(servers);
        });
    }

    public closeCreateServerModal() {
        this.showCreateServerModal = false;
    }
}
