import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./core/navbar/navbar";
import { Voicechat } from "./features/voicechat/voicechat";
import { Api } from './core/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Voicechat],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
    constructor(public api: Api) {
        api.login('user', 'pass').subscribe();
    }
  protected readonly title = signal('flux');
}

