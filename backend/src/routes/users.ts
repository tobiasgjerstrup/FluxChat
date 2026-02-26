import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import {
    getAllUsers,
    getDirectMessage,
    postDirectMessage,
    sendFriendRequest,
    respondToFriendRequest,
} from '../controllers/usersController.js';

const router = Router();

// Get all users
router.get('/', jwtAuthMiddleware, getAllUsers);
router.get('/message/:channelId', jwtAuthMiddleware, getDirectMessage);
// ? Messages a specific user.
router.post('/message/:userId', jwtAuthMiddleware, postDirectMessage);
// ? Messages a group.
// router.post('/message/group/:channelId', jwtAuthMiddleware, postDirectMessage);
// router.get('/friends', jwtAuthMiddleware, getAllFriends);
router.post('/friends/send', jwtAuthMiddleware, sendFriendRequest);
router.post('/friends/respond', jwtAuthMiddleware, respondToFriendRequest);

export default router;
