import { Component } from '@angular/core';
import { Modal } from '../../shared/modal/modal';

@Component({
    selector: 'app-navbar',
    imports: [Modal],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    showNotificationsModal = false;

    openNotificationsModal() {
        this.showNotificationsModal = true;
    }

    closeNotificationsModal() {
        this.showNotificationsModal = false;
    }
}
