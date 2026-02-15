import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { getChannels, postChannel } from '../controllers/channelsController.js';

const router = Router();

// Get all channels
router.get('/', jwtAuthMiddleware, getChannels);

// Post a new message
router.post('/', jwtAuthMiddleware, postChannel);

export default router;
