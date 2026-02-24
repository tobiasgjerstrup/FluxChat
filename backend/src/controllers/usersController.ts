import { Request, Response } from 'express';
import { getMessagesForDMChannel, getUsers, sendDirectMessage, getParticipantsForDMChannel } from '../services/db.js';
import { AuthRequest } from '../middleware/auth.js';

export function getDMParticipants(req: Request, res: Response) {
    try {
        if (typeof req.params.channelId !== 'string' || isNaN(parseInt(req.params.channelId))) {
            return res.status(400).json({ message: 'Channel ID must be a number' });
        }
        const participants = getParticipantsForDMChannel(parseInt(req.params.channelId));
        res.status(200).json({ participants });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch DM participants' });
    }
}

export function getAllUsers(req: Request, res: Response) {
    try {
        const users = getUsers();
        res.status(200).json({ message: 'Successfully fetched users', users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
}

export function getDirectMessage(req: Request, res: Response) {
    try {
        if (typeof req.params.channelId !== 'string' || isNaN(parseInt(req.params.channelId))) {
            return res.status(400).json({ message: 'Channel ID must be a number' });
        }
        const messages = getMessagesForDMChannel(parseInt(req.params.channelId));
        res.status(200).json({ messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch DM' });
    }
}

export function postDirectMessage(req: Request, res: Response) {
    try {
        if (!req.body.content || typeof req.body.content !== 'string') {
            return res.status(400).json({ message: 'Content is required and must be a string' });
        }
        if (typeof req.params.userId !== 'string' || isNaN(parseInt(req.params.userId))) {
            return res.status(400).json({ message: 'User ID must be a number' });
        }

        sendDirectMessage({
            author_id: (req as AuthRequest).user.id,
            participant_ids: [parseInt(req.params.userId), (req as AuthRequest).user.id],
            content: req.body.content,
        });
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send message' });
    }
}
