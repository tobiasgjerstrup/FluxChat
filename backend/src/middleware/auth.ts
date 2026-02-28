import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { HttpError } from '../utils/errors.js';
import { AuthRequest } from '../types/user.js';

export function jwtAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });
    try {
        const secret = config.jwtSecret;
        const decoded = jwt.verify(token, secret);
        req.user = { id: (decoded as { id: number }).id };
        next();
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
}
