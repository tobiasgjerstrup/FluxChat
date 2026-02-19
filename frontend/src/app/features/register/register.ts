import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api';

@Component({
    selector: 'app-register',
    imports: [FormsModule],
    templateUrl: './register.html',
    styleUrl: './register.scss',
})
export class Register {
    constructor(private api: Api) {}

    @Output() registerSuccess = new EventEmitter<void>();

    public username: string = '';
    public email: string = '';
    public password: string = '';

    public async register() {
        try {
            const response = await this.api.register(this.username, this.email, this.password);
            console.log('Registration successful', response);
            await this.api.login(this.username, this.password);
            this.registerSuccess.emit();
        } catch (error) {
            console.error('Registration failed', error);
        }
    }
}
