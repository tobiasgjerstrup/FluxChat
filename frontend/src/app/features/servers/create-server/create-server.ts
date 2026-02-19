import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/api';

@Component({
    selector: 'app-create-server',
    imports: [FormsModule],
    templateUrl: './create-server.html',
    styleUrl: './create-server.scss',
})
export class CreateServer {
    constructor(private api: Api) {}

    @Output() createdServer = new EventEmitter<void>();

    public serverName = '';
    public serverIcon = '';

    public async createServer() {
        try {
            await this.api.createServer(this.serverName, this.serverIcon);
            this.createdServer.emit();
        } catch (error) {
            console.error('Failed to create server', error);
        }
    }
}
