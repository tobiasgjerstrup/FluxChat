import { Response } from 'express';
import { HttpError } from '../utils/errors.js';
import {
    addServerMember,
    createServer,
    createServerInvite,
    getServerUserIsMemberOf,
    joinServerWithInvite,
} from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
import config from '../config.js';
import { AuthRequest } from '../types/user.js';
import type { RegisterServerBody, RegisterServerInviteBody } from '@flux/shared';

export function getServers(req: AuthRequest, res: Response) {
    try {
        const owner_id = req.user?.id;
        if (typeof owner_id !== 'number')
            return res.status(500).json({ error: 'Something went wrong getting user ID' });

        const servers = getServerUserIsMemberOf(owner_id);
        res.json(servers);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
}

export function postServer(req: AuthRequest, res: Response) {
    try {
        const body: unknown = req.body;
        if (!isRegisterServer(body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        const { name, icon_url } = body;
        const owner_id = req.user?.id;
        if (typeof owner_id !== 'number')
            return res.status(500).json({ error: 'Something went wrong getting user ID' });

        const server = createServer({ name, owner_id, icon_url });
        addServerMember({ server_id: server.id, user_id: owner_id });
        broadcastMessage({ ...server, owner_id });
        res.status(201).json(server);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create server' });
    }
}

export function postServerInvite(req: AuthRequest, res: Response) {
    try {
        const body: unknown = req.body;
        if (!isRegisterServerInvite(body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        const { server_id, channel_id, max_uses, expires_at, temporary } = body;
        if (typeof server_id !== 'number')
            return res.status(400).json({ error: 'Server ID is required and must be a number' });

        const creator_id = req.user?.id;
        if (typeof creator_id !== 'number')
            return res.status(500).json({ error: 'Something went wrong getting user ID' });

        if (getServerUserIsMemberOf(creator_id).find((s) => s.id === server_id) === undefined) {
            return res.status(403).json({ error: 'You must be a member of the server to create an invite' });
        }

        const inviteRes = createServerInvite({ server_id, channel_id, max_uses, expires_at, temporary, creator_id });
        res.status(201).json({
            message: 'Server invite created successfully',
            invite_code: inviteRes.code,
            invite_link: `${config.frontendUrl}/invite/${inviteRes.code}`,
        });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create server invite' });
    }
}

export function joinServer(req: AuthRequest, res: Response) {
    try {
        const code = req.params.code;
        if (typeof code !== 'string') return res.status(400).json({ error: 'Invite code is required' });

        const user_id = req.user?.id;
        if (typeof user_id !== 'number') return res.status(500).json({ error: 'Something went wrong getting user ID' });

        joinServerWithInvite(code, user_id);
        res.status(200).json({ message: 'Successfully joined server' });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to join server with invite' });
    }
}

function isRegisterServer(value: unknown): value is RegisterServerBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.name === 'string' && (b.icon_url === undefined || typeof b.icon_url === 'string');
}

function isRegisterServerInvite(value: unknown): value is RegisterServerInviteBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return (
        typeof b.server_id === 'number' &&
        (b.channel_id === undefined || typeof b.channel_id === 'number') &&
        (b.max_uses === undefined || typeof b.max_uses === 'number') &&
        (b.expires_at === undefined || typeof b.expires_at === 'string') &&
        (b.temporary === undefined || typeof b.temporary === 'boolean')
    );
}
