import { Response } from 'express';
import {
    getMessagesForDMChannel,
    getUsers,
    sendDirectMessage,
    getParticipantsForDMChannel,
    userAccept,
    userAdd,
    userReject,
    userRemove,
    getFriends,
} from '../services/db.js';
import { AuthRequest } from '../types/user.js';
import { HttpError } from '../utils/errors.js';
import type {
    RegisterDMMessageBody,
    RemoveFriendRequestBody,
    RespondToFriendRequestBody,
    SendFriendRequestBody,
} from '@flux/shared';

export function getDMParticipants(req: AuthRequest, res: Response) {
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

export function getAllUsers(req: AuthRequest, res: Response) {
    const author_id = req.user?.id;
    if (typeof author_id !== 'number') {
        return res.status(500).json({ message: 'Something went wrong getting user ID' });
    }
    try {
        const MAX_LIMIT = 100;
        const parsedLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : MAX_LIMIT;
        const parsedOffset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

        if (isNaN(parsedLimit) || parsedLimit < 0) {
            return res.status(400).json({ message: 'Limit must be a non-negative number' });
        }
        if (parsedOffset !== undefined && (isNaN(parsedOffset) || parsedOffset < 0)) {
            return res.status(400).json({ message: 'Offset must be a non-negative number' });
        }

        const limit = Math.min(parsedLimit, MAX_LIMIT);
        const offset = parsedOffset;
        const search = req.query.search ? (req.query.search as string) : undefined;

        const users = getUsers(author_id, { limit, offset, search });
        res.status(200).json({ message: 'Successfully fetched users', users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
}

export function getDirectMessage(req: AuthRequest, res: Response) {
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

export function postDirectMessage(req: AuthRequest, res: Response) {
    try {
        const body: unknown = req.body;
        if (!isRegisterDMMessage(body)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }
        if (!body.content || typeof body.content !== 'string') {
            return res.status(400).json({ message: 'Content is required and must be a string' });
        }
        if (typeof req.params.userId !== 'string' || isNaN(parseInt(req.params.userId))) {
            return res.status(400).json({ message: 'User ID must be a number' });
        }

        const author_id = req.user?.id;
        if (typeof author_id !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }

        sendDirectMessage({
            author_id: author_id,
            participant_ids: [parseInt(req.params.userId), author_id],
            content: body.content,
        });
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send message' });
    }
}

export function respondToFriendRequest(req: AuthRequest, res: Response) {
    const body: unknown = req.body;
    if (!isRespondToFriendRequest(body)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }
    const { userId, action } = body;
    if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: 'User ID is required and must be a number' });
    }

    try {
        const userIdToRespond = req.user?.id;
        if (typeof userIdToRespond !== 'number') {
            return res.status(500).json({ message: 'Something went wrong getting user ID' });
        }
        if (action === 'accept') {
            userAccept(userIdToRespond, userId);
        } else {
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

export function sendFriendRequest(req: AuthRequest, res: Response) {
    const body: unknown = req.body;
    if (!isSendFriendRequest(body)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }
    const { userId } = body;
    const userIdToAdd = req.user?.id;
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

export function removeFriend(req: AuthRequest, res: Response) {
    const body: unknown = req.body;
    if (!isRemoveFriendRequest(body)) {
        return res.status(400).json({ message: 'Invalid request body' });
    }
    const { userId } = body;
    const userIdToRemove = req.user?.id;
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

export function getAllFriends(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
        return res.status(500).json({ message: 'Something went wrong getting user ID' });
    }
    try {
        const friends = getFriends(userId);
        res.status(200).json({ message: 'Successfully fetched friends', friends });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch friends' });
    }
}

function isRegisterDMMessage(value: unknown): value is RegisterDMMessageBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.content === 'string';
}

function isRespondToFriendRequest(value: unknown): value is RespondToFriendRequestBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.userId === 'number' && (b.action === 'accept' || b.action === 'reject');
}

function isSendFriendRequest(value: unknown): value is SendFriendRequestBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.userId === 'number';
}

function isRemoveFriendRequest(value: unknown): value is RemoveFriendRequestBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.userId === 'number';
}
