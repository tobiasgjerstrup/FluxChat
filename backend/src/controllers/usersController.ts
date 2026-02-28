import { Request, Response } from 'express';
import {
    getMessagesForDMChannel,
    getUsers,
    sendDirectMessage,
    getParticipantsForDMChannel,
    userAccept,
    userAdd,
    userReject,
    userRemove,
} from '../services/db.js';
import { AuthRequest } from '../types/user.js';
import { HttpError } from '../utils/errors.js';

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

        const author_id = (req as AuthRequest).user?.id;
        if (typeof author_id !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }

        sendDirectMessage({
            author_id: author_id,
            participant_ids: [parseInt(req.params.userId), author_id],
            content: req.body.content,
        });
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send message' });
    }
}

export function respondToFriendRequest(req: Request, res: Response) {
    const { userId, action } = req.body;
    if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: 'User ID is required and must be a number' });
    }
    if (!action || (action !== 'accept' && action !== 'reject')) {
        return res.status(400).json({ message: 'Action is required and must be either "accept" or "reject"' });
    }

    try {
        const userIdToRespond = (req as AuthRequest).user?.id;
        if (typeof userIdToRespond !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }
        if (action === 'accept') {
            userAccept(userIdToRespond, userId);
        } else if (action === 'reject') {
            userReject(userIdToRespond, userId);
        }
        res.status(201).json({ message: 'Friend request responded' });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Failed to respond to friend request' });
    }
}

export function sendFriendRequest(req: Request, res: Response) {
    const userIdToAdd = (req as AuthRequest).user?.id;
    const { userId } = req.body;
    if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: 'User ID is required and must be a number' });
    }
    if (userId === userIdToAdd) {
        return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    try {
        if (typeof userIdToAdd !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }
        userAdd(userIdToAdd, userId);
        res.status(201).json({ message: 'Friend request sent' });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Failed to send friend request' });
    }
}

export function removeFriend(req: Request, res: Response) {
    const { userId } = req.body;
    const userIdToRemove = (req as AuthRequest).user?.id;
    if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: 'User ID is required and must be a number' });
    }
    if (userId === userIdToRemove) {
        return res.status(400).json({ message: 'You cannot remove yourself from friends' });
    }

    try {
        if (typeof userIdToRemove !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }
        userRemove(userIdToRemove, userId);
        res.status(201).json({ message: 'Friend removed' });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Failed to remove friend' });
    }
}
