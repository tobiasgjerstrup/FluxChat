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
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function postMessage(req: Request, res: Response) {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        const userId = (req as AuthRequest).user?.id || null; // req.user set by JWT middleware
        const message = await saveMessage({ text, userId });
        broadcastMessage({ ...message, userId });
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save message' });
    }
}
