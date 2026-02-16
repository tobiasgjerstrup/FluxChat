import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './core/navbar/navbar';
import { Api } from './core/api';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, Navbar],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    constructor(public api: Api) {
        api.JWT = signal(localStorage.getItem('jwt') || '');
    }
    protected readonly title = signal('flux');
}
