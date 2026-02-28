import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server, testUser, testToken } from './setup';

describe('Users API', () => {
    it('GET /api/users returns all users (auth)', async () => {
        const res = await request(server).get('/api/users').set('Authorization', `Bearer ${testToken}`);
        expect(res.status).toBe(200);
        // Add more assertions as needed
    });
});

describe('Friend Requests', () => {
    const userA = { username: testUser.username + 'A', password: testUser.password, email: testUser.email + 'A' };
    const userB = { username: testUser.username + 'B', password: testUser.password, email: testUser.email + 'B' };
    let tokenA: string, tokenB: string, userIdA: number, userIdB: number, requestId: number;

    it('should register and login two users', async () => {
        // Register A
        await request(server).post('/api/auth/register').send(userA);
        const loginA = await request(server)
            .post('/api/auth/login')
            .send({ username: userA.username, password: userA.password });
        tokenA = loginA.body.token;
        userIdA = loginA.body.id;
        // Register B
        await request(server).post('/api/auth/register').send(userB);
        const loginB = await request(server)
            .post('/api/auth/login')
            .send({ username: userB.username, password: userB.password });
        tokenB = loginB.body.token;
        userIdB = loginB.body.id;
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
        expect(res.body.message).toBe('Friend request responded');
    });

    it('should not allow duplicate friend requests', async () => {
        const resSend = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(resSend.status).toBe(400);
        expect(resSend.body.message).toBe('You are already friends');
    });

    it('should remove friend', async () => {
        const res = await request(server)
            .post('/api/users/friends/remove')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Friend removed');
    });

    it('should send and deny a friend request', async () => {
        // Send another request
        const resSend = await request(server)
            .post('/api/users/friends/send')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ userId: userIdA });
        expect(resSend.body.message).toBe('Friend request sent');
        expect(resSend.status).toBe(201);
        // Wait for the request to be available if needed
        await wait(500);
        const resDeny = await request(server)
            .post('/api/users/friends/respond')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userIdB, action: 'reject' });
        expect(resDeny.status).toBe(201);
        expect(resDeny.body.message).toBe('Friend request responded');
    });
});

// Helper to pause for a given ms
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
