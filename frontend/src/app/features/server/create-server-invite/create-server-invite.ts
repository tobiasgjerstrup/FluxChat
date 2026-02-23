import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/api';
import { signal } from '@angular/core';

@Component({
    selector: 'app-create-server-invite',
    imports: [],
    templateUrl: './create-server-invite.html',
    styleUrl: './create-server-invite.scss',
})
export class CreateServerInvite {
    constructor(
        private api: Api,
        private route: ActivatedRoute,
    ) {
        this.serverId = Number(this.route.parent?.snapshot.paramMap.get('serverId'));
    }

    serverId: number;

    public invite = signal({ invite_code: '', invite_link: '' });

    public async createServerInvite() {
        try {
            if (!this.serverId) {
                console.error('Server ID is missing');
                return;
            }
            this.invite.set(await this.api.createServerInvite(this.serverId));
        } catch (error) {
            console.error('Failed to create server invite', error);
        }
    }

    public copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }
}
