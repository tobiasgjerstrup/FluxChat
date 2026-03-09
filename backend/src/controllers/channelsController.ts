import { Request, Response } from 'express';
import { createChannel, getChannelsFromServer } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
import { HttpError } from '../utils/errors.js';
import { AuthRequest } from '../types/user.js';
import type { RegisterChannelBody } from '@flux/shared';

export function getChannels(req: Request, res: Response) {
    try {
        const serverId = req.params.serverId;
        if (!serverId || isNaN(Number(serverId))) {
            return res.status(400).json({ error: 'Server ID is required' });
        }
        const channels = getChannelsFromServer(Number(serverId));
        res.json(channels);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
}

export function postChannel(req: AuthRequest, res: Response) {
    try {
        const body: unknown = req.body;
        if (!isRegisterChannel(body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        const { server_id, name, type } = body;
        const owner_id = req.user?.id;
        if (typeof owner_id !== 'number') {
            return res.status(500).json({ error: 'Something went wrong getting user ID' });
        }

        const channel = createChannel({ server_id, name, type });
        broadcastMessage({ ...channel, owner_id });
        res.status(201).json(channel);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create channel' });
    }
}

function isRegisterChannel(value: unknown): value is RegisterChannelBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.server_id === 'number' && typeof b.name === 'string' && (b.type === 'text' || b.type === 'voice');
}
