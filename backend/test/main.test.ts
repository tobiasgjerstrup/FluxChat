import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import app from '../src/main';
import config from '../src/config.js';

describe('Health check endpoint', () => {
    let server: http.Server;

    beforeAll(() => {
        server = app.listen(0); // Listen on a random available port
    });

    afterAll(() => {
        return new Promise((resolve) => server.close(resolve));
    });

    it('GET /api/health should return status ok', async () => {
        const res = await request(server).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        console.log(config.dbPath);
    });
});
