import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { createUser, findUserByUsername, getRefreshToken, storeRefreshToken } from '../services/db.js';
import bcrypt from 'bcrypt';
import { HttpError } from '../utils/errors.js';

const router = Router();

// Register endpoint
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing username, email, or password' });
    }
    try {
        const user = await createUser({ username, email, password });
        return res.status(201).json({ id: user.id, username: user.username, email: user.email });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        console.log(err);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }
    const user = findUserByUsername(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, type: 'access' }, config.jwtSecret, {
        expiresIn: config.jwtExpiration,
    });
    const refreshToken = jwt.sign({ id: user.id, username: user.username, type: 'refresh' }, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiration,
    });

    storeRefreshToken({ user_id: user.id, token: refreshToken });

    return res.json({ token, refreshToken, id: user.id, username: user.username, email: user.email });
});

router.post('/refresh', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Invalid Authorization header format' });
    }
    const refreshToken = req.headers['refresh-token'] as string | undefined;
    if (!refreshToken) {
        return res.status(401).json({ error: 'Missing Refresh-Token header' });
    }

    let payload = { id: 0, username: '', type: '' };
    try {
        payload = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true }) as {
            id: number;
            username: string;
            type: string;
        };
        if (payload.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token type' });
        }
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.httpCode).json({ error: err.message });
        }
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (!getRefreshToken(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const newToken = jwt.sign({ id: payload.id, username: payload.username, type: 'access' }, config.jwtSecret, {
        expiresIn: config.jwtExpiration,
    });
    return res.json({ token: newToken });
});

export default router;
