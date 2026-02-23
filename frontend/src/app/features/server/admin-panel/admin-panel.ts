import { Component } from '@angular/core';
import { Modal } from '../../../shared/modal/modal';
import { CreateServerInvite } from '../create-server-invite/create-server-invite';

@Component({
    selector: 'app-admin-panel',
    imports: [Modal, CreateServerInvite],
    templateUrl: './admin-panel.html',
    styleUrl: './admin-panel.scss',
})
export class AdminPanel {
    public showCreateServerInviteModal = false;

    public closeCreateServerInviteModal() {
        this.showCreateServerInviteModal = false;
    }
}
