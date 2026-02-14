import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';

const router = Router();

// Dummy user for demonstration
const DEMO_USER = { id: '1', username: 'user', password: 'pass' };

router.post('/login', (req, res) => {
    DEMO_USER.id = String(Math.floor(Math.random() * 100) + 1);
    const { username, password } = req.body;
    if (username === DEMO_USER.username && password === DEMO_USER.password) {
        const secret = config.jwtSecret;
        const token = jwt.sign({ id: DEMO_USER.id, username }, secret, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

export default router;
