import { Component, signal } from '@angular/core';
import { Api, Server } from '../../core/api';

@Component({
    selector: 'app-servers',
    imports: [],
    templateUrl: './servers.html',
    styleUrl: './servers.scss',
})
export class Servers {
    constructor(private api: Api) {}

    public servers = signal<Server[]>([]);

    ngOnInit() {
        this.api.getServers().subscribe((servers) => {
            this.servers.set(servers);
        });
    }
}
