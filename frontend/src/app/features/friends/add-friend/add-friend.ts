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

    public users = signal<{ id: number; username: string }[]>([]);
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
        }, 50);
    }

    public async getUsers() {
        this.users.set((await this.api.getUsers(this.search() ?? undefined)).users);
    }

    public async addFriend(userId: number) {
        const res = await this.api.addFriend(userId);
        console.log(res);
    }
}
