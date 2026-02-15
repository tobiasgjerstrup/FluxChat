import e, { Request, Response } from 'express';
import { getAllMessages, saveMessage } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
// Extend Request type to include user property
interface AuthRequest extends Request {
    user?: any;
}

export async function getMessages(req: Request, res: Response) {
    try {
        const messages = await getAllMessages();
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function postMessage(req: Request, res: Response) {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });
        const author_id = (req as AuthRequest).user?.id || null; // req.user set by JWT middleware
        const message = await saveMessage({ content, author_id });
        broadcastMessage({ ...message, author_id });
        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save message' });
    }
}
