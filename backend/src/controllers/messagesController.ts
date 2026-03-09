import { Request, Response } from 'express';
import { getMessagesFromChannel, getUsernameById, saveMessage } from '../services/db.js';
import { broadcastMessage } from '../ws/chat.js';
import { HttpError } from '../utils/errors.js';
import { AuthRequest } from '../types/user.js';
import type { RegisterMessageBody } from '@flux/shared';

export function getMessages(req: Request, res: Response) {
    try {
        const channelId = req.params.channelId;
        if (!channelId || isNaN(Number(channelId))) {
            return res.status(400).json({ error: 'Channel ID is required' });
        }
        const messages = getMessagesFromChannel(Number(channelId));
        res.json(messages);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export function postMessage(req: AuthRequest, res: Response) {
    try {
        const body: unknown = req.body;
        if (!isRegisterMessage(body)) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        // Type assertion needed for CI environment
        const validatedBody = body as RegisterMessageBody;
        const { content, channel_id } = validatedBody;
        if (!content || !channel_id) return res.status(400).json({ error: 'Content and channel ID are required' });
        const author_id = req.user?.id; // req.user set by JWT middleware
        if (typeof author_id !== 'number') {
            return res.status(500).json({ error: 'Something went wrong getting user ID' });
        }
        const message = saveMessage({ content, author_id, channel_id });
        const author_username = getUsernameById(author_id); // Optionally include author's username
        broadcastMessage({ ...message, author_id, author_username });
        res.status(201).json(message);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to save message' });
    }
}

function isRegisterMessage(value: unknown): value is RegisterMessageBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.content === 'string' && typeof b.channel_id === 'number';
}
