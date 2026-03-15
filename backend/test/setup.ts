import app from '../src/main.js';

export const server = app.listen(0);

import request from 'supertest';
import type { Response } from 'supertest';

export const testUser = {
    username: 'testuser_' + Math.random().toString(36).substring(2, 10),
    password: 'TestPassword123!',
    email: 'test_' + Math.random().toString(36).substring(2, 10) + '@example.com',
};

export let testToken: string | null = null;

import { beforeAll } from 'vitest';

interface LoginResponseBody {
    token: string;
}

function getLoginResponseBody(res: Response): LoginResponseBody {
    const body: unknown = res.body;
    if (typeof body !== 'object' || body === null || !('token' in body)) {
        throw new Error('Login response is missing token');
    }

    const token = (body as { token: unknown }).token;
    if (typeof token !== 'string') {
        throw new Error('Login response token must be a string');
    }

    return { token };
}

beforeAll(async () => {
    // Register
    await request(server).post('/api/auth/register').send(testUser);
    // Login
    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
    testToken = getLoginResponseBody(loginRes).token;
});
