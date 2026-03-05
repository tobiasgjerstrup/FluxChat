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

    ngOnInit() {
        this.getUsers();
    }

    public async getUsers() {
        this.users.set((await this.api.getUsers(this.search() ?? undefined)).users);
    }

    public addFriend(userId: number) {}
}
