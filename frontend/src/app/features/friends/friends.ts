import { Component } from '@angular/core';
import { Modal } from '../../shared/modal/modal';
import { AddFriend } from './add-friend/add-friend';

@Component({
    selector: 'app-friends',
    imports: [Modal, AddFriend],
    templateUrl: './friends.html',
    styleUrl: './friends.scss',
})
export class Friends {
    public showAddFriendModal = false;

    public async closeAddFriendModal() {
        this.showAddFriendModal = false;
    }
}
