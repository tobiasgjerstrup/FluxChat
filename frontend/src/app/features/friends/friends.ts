import { Component, signal } from '@angular/core';
import { Modal } from '../../shared/modal/modal';
import { AddFriend } from './add-friend/add-friend';
import { Api } from '../../core/api';

@Component({
    selector: 'app-friends',
    imports: [Modal, AddFriend],
    templateUrl: './friends.html',
    styleUrl: './friends.scss',
})
export class Friends {
    constructor(private api: Api) {}

    public showAddFriendModal = false;
    public friends = signal<Array<{ id: number; username: string; status: string; relation_type: string }>>([]);

    public async closeAddFriendModal() {
        this.showAddFriendModal = false;
    }

    async ngOnInit() {
        try {
            const res = await this.api.getFriends();
            this.friends.set(res);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    }

    public async acceptFriendRequest(userId: number) {
        try {
            await this.api.handleFriendAction(userId, 'accept');
            const res = await this.api.getFriends();
            this.friends.set(res);
        } catch (error) {
            console.error('Failed to accept friend request:', error);
        }
    }

    public async rejectFriendRequest(userId: number) {
        try {
            await this.api.handleFriendAction(userId, 'reject');
            const res = await this.api.getFriends();
            this.friends.set(res);
        } catch (error) {
            console.error('Failed to reject friend request:', error);
        }
    }

    public async removeFriend(userId: number) {
        try {
            await this.api.removeFriend(userId);
            const res = await this.api.getFriends();
            this.friends.set(res);
        } catch (error) {
            console.error('Failed to remove friend:', error);
        }
    }
}
