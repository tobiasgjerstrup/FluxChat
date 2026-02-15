import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import messageRoutes from './routes/messages.js';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import { jwtAuthMiddleware } from './middleware/auth.js';
import { setupWebSocket } from './ws/chat.js';

dotenv.config();

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

import type { Request, Response } from 'express';
import config from './config.js';
// Health check
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));

// WebSocket setup
setupWebSocket(server);
server.listen(config.port, config.ip, () => {
    console.log(`Server running on port ${config.port}`);
});
