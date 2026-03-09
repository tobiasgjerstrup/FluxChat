import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Response } from 'supertest';
import { server, testUser, testToken } from './setup.js';

interface AuthResponseBody {
    token: string;
    id: number;
}

interface MessageResponseBody {
    message: string;
}

function getStringField(body: unknown, field: string): string {
    if (typeof body !== 'object' || body === null || !(field in body)) {
        throw new Error(`Response is missing ${field}`);
    }

    const value = (body as Record<string, unknown>)[field];
    if (typeof value !== 'string') {
        throw new Error(`Response field ${field} must be a string`);
    }

    return value;
}

function getNumberField(body: unknown, field: string): number {
    if (typeof body !== 'object' || body === null || !(field in body)) {
        throw new Error(`Response is missing ${field}`);
    }

    const value = (body as Record<string, unknown>)[field];
    if (typeof value !== 'number') {
        throw new Error(`Response field ${field} must be a number`);
    }

    return value;
}

function getAuthResponseBody(res: Response): AuthResponseBody {
    return {
        token: getStringField(res.body, 'token'),
        id: getNumberField(res.body, 'id'),
    };
}

function getMessageResponseBody(res: Response): MessageResponseBody {
    return {
        message: getStringField(res.body, 'message'),
    };
}

function getTokenOrThrow(token: string | null): string {
    if (typeof token !== 'string') {
        throw new Error('Expected test token to be initialized');
    }
    return token;
}

describe('Users API', () => {
    it('GET /api/users returns all users (auth)', async () => {
        const token = getTokenOrThrow(testToken);
        const res = await request(server).get('/api/users').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        // Add more assertions as needed
    });
});

describe('Friend Requests', () => {
    const userA = { username: `${testUser.username}A`, password: testUser.password, email: `${testUser.email}A` };
    const userB = { username: `${testUser.username}B`, password: testUser.password, email: `${testUser.email}B` };
    const userC = { username: `${testUser.username}C`, password: testUser.password, email: `${testUser.email}C` };
    const userD = { username: `${testUser.username}D`, password: testUser.password, email: `${testUser.email}D` };
    let tokenA: string, tokenB: string, userIdA: number, userIdB: number;

    it('should register and login two users', async () => {
        // Register A
        await request(server).post('/api/auth/register').send(userA);
        const loginA = await request(server)
            .post('/api/auth/login')
            .send({ username: userA.username, password: userA.password });
        const loginABody = getAuthResponseBody(loginA);
        tokenA = loginABody.token;
        userIdA = loginABody.id;
        // Register B
        await request(server).post('/api/auth/register').send(userB);
        const loginB = await request(server)
            .post('/api/auth/login')
            .send({ username: userB.username, password: userB.password });
        const loginBBody = getAuthResponseBody(loginB);
        tokenB = loginBBody.token;
        userIdB = loginBBody.id;
        expect(tokenA).toBeTruthy();
        expect(tokenB).toBeTruthy();
        expect(userIdA).toBeTruthy();
        expect(userIdB).toBeTruthy();
    });

    it('should send a friend request', async () => {
        const res = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
    });

    it('should accept a friend request', async () => {
        const res = await request(server)
            .post('/api/users/friends/respond')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ userId: userIdA, action: 'accept' });
        expect(res.status).toBe(201);
        expect(getMessageResponseBody(res).message).toBe('Friend request responded');
    });

    it('should not allow duplicate friend requests', async () => {
        const resSend = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(resSend.status).toBe(400);
        expect(getMessageResponseBody(resSend).message).toBe('You are already friends');
    });

    it('should remove friend', async () => {
        const res = await request(server)
            .post('/api/users/friends/remove')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(res.status).toBe(201);
        expect(getMessageResponseBody(res).message).toBe('Friend removed');
    });

    it('should send and deny a friend request', async () => {
        // Send another request
        const resSend = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ userId: userIdA });
        expect(getMessageResponseBody(resSend).message).toBe('Friend request sent');
        expect(resSend.status).toBe(201);
        // Wait for the request to be available if needed
        await wait(500);
        const resDeny = await request(server)
            .post('/api/users/friends/respond')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB, action: 'reject' });
        expect(resDeny.status).toBe(201);
        expect(getMessageResponseBody(resDeny).message).toBe('Friend request responded');
    });

    it('should not remove non-friends due to unrelated pending request', async () => {
        await request(server).post('/api/auth/register').send(userC);
        const loginC = await request(server)
            .post('/api/auth/login')
            .send({ username: userC.username, password: userC.password });
        const loginCBody = getAuthResponseBody(loginC);
        const tokenC = loginCBody.token;
        const userIdC = loginCBody.id;

        await request(server).post('/api/auth/register').send(userD);
        const loginD = await request(server)
            .post('/api/auth/login')
            .send({ username: userD.username, password: userD.password });
        const loginDBody = getAuthResponseBody(loginD);
        const userIdD = loginDBody.id;

        expect(tokenC).toBeTruthy();
        expect(userIdC).toBeTruthy();
        expect(userIdD).toBeTruthy();

        const unrelatedPending = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ userId: userIdD });
        expect(unrelatedPending.status).toBe(201);

        const removeRes = await request(server)
            .post('/api/users/friends/remove')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(removeRes.status).toBe(400);
        expect(getMessageResponseBody(removeRes).message).toBe('You are not friends');
    });
});

// Helper to pause for a given ms
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
