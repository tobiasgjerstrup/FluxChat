import { Request, Response } from 'express';
import { createChannel, getChannelsFromServer } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
// Extend Request type to include user property
interface AuthRequest extends Request {
    user?: any;
}

export async function getChannels(req: Request, res: Response) {
    try {
        const serverId = req.params.serverId;
        if (!serverId || isNaN(Number(serverId))) {
            return res.status(400).json({ error: 'Server ID is required' });
        }
        const channels = getChannelsFromServer(Number(serverId));
        res.json(channels);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
}

export async function postChannel(req: Request, res: Response) {
    try {
        const { server_id, name, type } = req.body;
        if (!server_id || !name || !type)
            return res.status(400).json({ error: 'Server ID, name, and type are required' });
        const owner_id = (req as AuthRequest).user?.id || null;

        const channel = createChannel({ server_id, name, type });
        broadcastMessage({ ...channel, owner_id });
        res.status(201).json(channel);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create channel' });
    }
}
