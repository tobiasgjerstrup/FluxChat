import { Component, EventEmitter, Output } from '@angular/core';
import { Api } from '../../core/api';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    constructor(private api: Api) {}

    @Output() loginSuccess = new EventEmitter<void>();

    public username: string = '';
    public password: string = '';

    public async login() {
        try {
            const response = await this.api.login(this.username, this.password);
            console.log('Login successful', response);
            this.loginSuccess.emit();
        } catch (error) {
            console.error('Login failed', error);
        }
    }
}
