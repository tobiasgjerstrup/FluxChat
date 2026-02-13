import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";


import messageRoutes from "./routes/messages.js";
import authRoutes from "./routes/auth.js";
import { jwtAuthMiddleware } from "./middleware/auth.js";
import { setupWebSocket } from "./ws/chat.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
	origin: '*',
	credentials: true
}));
app.use(express.json());

// JWT Auth Middleware (for protected routes)
// app.use(jwtAuthMiddleware); // Uncomment to protect all routes


// Auth route
app.use("/api/auth", authRoutes);

// Message routes
app.use("/api/messages", messageRoutes);

import type { Request, Response } from "express";
// Health check
app.get("/api/health", (req: Request, res: Response) => res.json({ status: "ok" }));

// WebSocket setup
setupWebSocket(server);

const PORT = parseInt(process.env.PORT || '3001');
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`);
});
