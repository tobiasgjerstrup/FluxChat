import { Component, signal, OnInit } from '@angular/core';
import { Api } from '../../../core/api';

@Component({
    selector: 'app-add-friend',
    imports: [],
    templateUrl: './add-friend.html',
    styleUrl: './add-friend.scss',
})
export class AddFriend implements OnInit {
    constructor(private api: Api) {}

    public users = signal<{ id: number; username: string }[]>([]);

    ngOnInit() {
        this.getUsers();
    }

    public async getUsers() {
        this.users.set((await this.api.getUsers()).users);
    }

    public addFriend(userId: number) {}
}
