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

    public login() {
        this.api.login(this.username, this.password).subscribe({
            next: (response) => {
                console.log('Login successful', response);
                this.loginSuccess.emit();
            },
            error: (error) => {
                console.error('Login failed', error);
            },
        });
    }
}
