import { Request, Response } from 'express';
import { createServer, getAllServers } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
// Extend Request type to include user property
interface AuthRequest extends Request {
    user?: any;
}

export async function getServers(req: Request, res: Response) {
    try {
        const servers = getAllServers();
        res.json(servers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
}

export async function postServer(req: Request, res: Response) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const owner_id = (req as AuthRequest).user?.id || null;

        const server = createServer({ name, owner_id, icon_url: req.body.icon_url });
        broadcastMessage({ ...server, owner_id });
        res.status(201).json(server);
    } catch (err: any) {
        if (err.message === 'Server name already exists') {
            return res.status(400).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create server' });
    }
}
