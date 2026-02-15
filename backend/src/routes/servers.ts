import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { postServer, getServers } from '../controllers/serversController.js';

const router = Router();

// Get all messages
router.get('/', jwtAuthMiddleware, getServers);

// Post a new message
router.post('/', jwtAuthMiddleware, postServer);

export default router;
