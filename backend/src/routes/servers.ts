import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { postServer, getServers, joinServer, postServerInvite } from '../controllers/serversController.js';

const router = Router();

router.get('/', jwtAuthMiddleware, getServers);
router.get('/invite/:code', jwtAuthMiddleware, joinServer);

router.post('/', jwtAuthMiddleware, postServer);
router.post('/invite', jwtAuthMiddleware, postServerInvite);

export default router;
