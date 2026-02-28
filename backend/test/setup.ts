import app from '../src/main';

export const server = app.listen(0);

import request from 'supertest';

export const testUser = {
    username: 'testuser_' + Math.random().toString(36).substring(2, 10),
    password: 'TestPassword123!',
    email: 'test_' + Math.random().toString(36).substring(2, 10) + '@example.com',
};

export let testToken: string | null = null;

import { beforeAll } from 'vitest';

beforeAll(async () => {
    // Register
    await request(server).post('/api/auth/register').send(testUser);
    // Login
    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
    testToken = loginRes.body.token;
});
