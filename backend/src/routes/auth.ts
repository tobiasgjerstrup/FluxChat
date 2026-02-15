import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { createUser, findUserByUsername } from '../services/db.js';
import bcrypt from 'bcrypt';

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
    } catch (err: any) {
        if (err.message === 'Username or email already exists') {
            return res.status(409).json({ error: 'Username or email already exists' });
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
    const secret = config.jwtSecret;
    const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '1h' });
    return res.json({ token });
});

export default router;
