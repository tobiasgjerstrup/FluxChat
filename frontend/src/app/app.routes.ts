import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'servers',
        loadComponent: () => import('./features/servers/servers').then((m) => m.Servers),
    },
    {
        path: 'server/:serverId',
        loadComponent: () => import('./features/server/server').then((m) => m.Server),
        children: [
            {
                path: 'channel/:channelId',
                loadComponent: () => import('./features/server/channel/channel').then((m) => m.Channel),
            },
            {
                path: 'admin-panel',
                loadComponent: () => import('./features/server/admin-panel/admin-panel').then((m) => m.AdminPanel),
            },
        ],
    },
    {
        path: 'invite/:inviteCode',
        loadComponent: () => import('./features/server/use-invite/use-invite').then((m) => m.UseInvite),
    },
    {
        path: 'friends',
        loadComponent: () => import('./features/friends/friends').then((m) => m.Friends),
    },
];
