import { Component } from '@angular/core';
import { Modal } from '../../shared/modal/modal';
import { Login } from '../../features/login/login';
import { Register } from '../../features/register/register';
import { Api } from '../api';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [Modal, Login, Register, RouterLink],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    constructor(public api: Api) {}

    public showNotificationsModal = false;
    public showLoginModal = false;
    public showRegisterModal = false;

    public openNotificationsModal() {
        this.showNotificationsModal = true;
    }

    public closeNotificationsModal() {
        this.showNotificationsModal = false;
    }

    public openLoginModal() {
        this.showLoginModal = true;
    }

    public closeLoginModal() {
        this.showLoginModal = false;
    }

    public openRegisterModal() {
        this.showRegisterModal = true;
    }

    public closeRegisterModal() {
        this.showRegisterModal = false;
    }

    public logout() {
        localStorage.removeItem('jwt');
        location.reload();
    }
}
