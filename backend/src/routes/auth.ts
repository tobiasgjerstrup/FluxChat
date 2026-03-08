import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { createUser, findUserByUsername, getRefreshToken, storeRefreshToken } from '../services/db.js';
import bcrypt from 'bcrypt';
import { HttpError } from '../utils/errors.js';
import { LoginBody, RegisterBody } from '@flux/shared';

const router = Router();

// Register endpoint
router.post('/register', async (req, res) => {
    const body: unknown = req.body;
    if (!isRegisterBody(body)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const user = await createUser(body);
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
    const body: unknown = req.body;
    if (!isLoginBody(body)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const user = findUserByUsername(body.username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(body.password, user.password_hash);
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

function isRegisterBody(value: unknown): value is RegisterBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.username === 'string' && typeof b.email === 'string' && typeof b.password === 'string';
}

function isLoginBody(value: unknown): value is LoginBody {
    if (typeof value !== 'object' || value === null) return false;
    const b = value as Record<string, unknown>;
    return typeof b.username === 'string' && typeof b.password === 'string';
}
