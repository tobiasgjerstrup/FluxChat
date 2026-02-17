import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat').then((m) => m.Chat),
    },
];
