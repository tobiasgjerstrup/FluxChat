import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./core/navbar/navbar";
import { Voicechat } from "./features/voicechat/voicechat";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Voicechat],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('flux');
}

