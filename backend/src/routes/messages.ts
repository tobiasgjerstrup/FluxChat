import { Router } from 'express';
import { getMessages, postMessage } from '../controllers/messagesController.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// Get all messages
router.get('/:channelId', jwtAuthMiddleware, getMessages);

// Post a new message
router.post('/', jwtAuthMiddleware, postMessage);

export default router;
