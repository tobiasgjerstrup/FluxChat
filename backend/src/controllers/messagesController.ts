import { Request, Response } from 'express';
import { getMessagesFromChannel, saveMessage } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
// Extend Request type to include user property
interface AuthRequest extends Request {
    user?: any;
}

export async function getMessages(req: Request, res: Response) {
    try {
        const channelId = req.params.channelId;
        if (!channelId || isNaN(Number(channelId))) {
            return res.status(400).json({ error: 'Channel ID is required' });
        }
        const messages = await getMessagesFromChannel(Number(channelId));
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function postMessage(req: Request, res: Response) {
    try {
        const { content, channel_id } = req.body;
        if (!content || !channel_id) return res.status(400).json({ error: 'Content and channel ID are required' });
        const author_id = (req as AuthRequest).user?.id || null; // req.user set by JWT middleware
        const message = saveMessage({ content, author_id, channel_id });
        broadcastMessage({ ...message, author_id });
        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save message' });
    }
}
