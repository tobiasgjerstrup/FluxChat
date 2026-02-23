import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/api';

@Component({
    selector: 'app-use-invite',
    imports: [],
    templateUrl: './use-invite.html',
    styleUrl: './use-invite.scss',
})
export class UseInvite {
    constructor(
        private route: ActivatedRoute,
        private api: Api,
    ) {
        this.inviteCode = this.route.snapshot.paramMap.get('inviteCode');
    }

    private inviteCode;

    async ngOnInit() {
        if (!this.inviteCode) {
            console.error('Invite code is missing in the route');
            return;
        }

        const inviteRes = await this.api.useServerInvite(this.inviteCode);
    }
}
