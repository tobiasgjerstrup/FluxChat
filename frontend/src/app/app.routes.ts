import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat').then((m) => m.Chat),
    },
    {
        path: 'servers',
        loadComponent: () => import('./features/servers/servers').then((m) => m.Servers),
    },
    {
        path: 'server/:serverId',
        loadComponent: () => import('./features/server/server').then((m) => m.Server),
        children: [
            {
                path: ':channelId',
                loadComponent: () => import('./features/server/channel/channel').then((m) => m.Channel),
            },
        ],
    },
];
