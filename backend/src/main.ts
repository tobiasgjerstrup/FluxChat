import express from 'express';
import http from 'http';
import cors from 'cors';

import messageRoutes from './routes/messages.js';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import channelRoutes from './routes/channels.js';
import userRoutes from './routes/users.js';
// import { jwtAuthMiddleware } from './middleware/auth.js';
import { setupWebSocket } from './ws/chat.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(
    cors({
        origin: '*',
        credentials: true,
    }),
);
app.use(express.json());

// JWT Auth Middleware (for protected routes)
// app.use(jwtAuthMiddleware); // Uncomment to protect all routes

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

import type { Request, Response } from 'express';
import config from './config.js';
// Health check
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));

// WebSocket setup and server start only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    setupWebSocket(server);
    server.listen(config.port, config.ip, () => {
        console.log(`Server running on port ${config.port}`);
    });
}

export default app;
