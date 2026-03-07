import { Component, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/api';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-friend',
    imports: [FormsModule],
    templateUrl: './add-friend.html',
    styleUrl: './add-friend.scss',
})
export class AddFriend implements OnInit {
    constructor(private api: Api) {}

    public users = signal<{ id: number; username: string; FS_Status: string | null; FR_Status: string | null }[]>([]);
    public search = signal('');
    private searchTimeout?: number;

    ngOnInit() {
        this.getUsers();
    }

    public onSearchInput() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = window.setTimeout(() => {
            this.getUsers();
        }, 250);
    }

    public async getUsers() {
        try {
            this.users.set((await this.api.getUsers(this.search() ?? undefined)).users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    public async friendAction(userId: number, action: 'accept' | 'reject' | 'add') {
        try {
            const res = await this.api.handleFriendAction(userId, action);
            if (res.message.toLowerCase().includes('friend request sent')) {
                this.users.update((users) =>
                    users.map((user) =>
                        user.id === userId ? { ...user, FS_Status: 'pending', FR_Status: null } : user,
                    ),
                );
            }
        } catch (error) {
            console.error('Error performing friend action:', error);
        }
    }
}
