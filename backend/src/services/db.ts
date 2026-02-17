import Database from 'better-sqlite3';

import { sqliteDBSetup } from '../db/sqlite.js';
import bcrypt from 'bcrypt';

const db: Database.Database = await sqliteDBSetup();

export async function getAllMessages() {
    return db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
}

export function saveMessage({
    content,
    author_id,
    channel_id,
}: {
    content: string;
    author_id: string;
    channel_id: number;
}) {
    const stmt = db.prepare(
        "INSERT INTO messages (content, author_id, channel_id, created_at) VALUES (?, ?, ?, datetime('now'))",
    );
    const info = stmt.run(content, author_id, channel_id);
    return { id: info.lastInsertRowid, content, author_id, channel_id, created_at: new Date().toISOString() };
}

export async function createUser({ username, email, password }: { username: string; email: string; password: string }) {
    const password_hash = await bcrypt.hash(password, 10);
    try {
        const stmt = db.prepare(
            "INSERT INTO Users (username, email, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))",
        );
        const info = stmt.run(username, email, password_hash);
        return { id: info.lastInsertRowid, username, email };
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Username or email already exists');
        }
        throw err;
    }
}

export function findUserByUsername(username: string) {
    const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
    const user = stmt.get(username) as
        | undefined
        | { id: number; username: string; email: string; password_hash: string };
    return user;
}

export function createServer({
    name,
    owner_id,
    icon_url = null,
}: {
    name: string;
    owner_id: number;
    icon_url?: string | null;
}) {
    try {
        const stmt = db.prepare(
            "INSERT INTO Servers (name, owner_id, icon_url, created_at) VALUES (?, ?, ?, datetime('now'))",
        );
        const info = stmt.run(name, owner_id, icon_url);
        return { id: info.lastInsertRowid, name, owner_id, icon_url };
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('Server name already exists');
        }
        throw err;
    }
}

export function getAllServers() {
    return db.prepare('SELECT * FROM Servers ORDER BY created_at ASC').all();
}

export function createChannel({ server_id, name, type }: { server_id: number; name: string; type: string }) {
    try {
        const stmt = db.prepare(
            "INSERT INTO Channels (server_id, name, type, created_at) VALUES (?, ?, ?, datetime('now'))",
        );
        const info = stmt.run(server_id, name, type);
        return { id: info.lastInsertRowid, server_id, name, type };
    } catch (err: any) {
        throw err;
    }
}

export function getAllChannels() {
    return db.prepare('SELECT * FROM Channels ORDER BY created_at ASC').all();
}

export function storeRefreshToken({ user_id, token }: { user_id: number; token: string }) {
    try {
        const stmt = db.prepare(
            "INSERT INTO RefreshTokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))",
        );
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        stmt.run(user_id, token, expiresAt);
    } catch (err: any) {
        throw err;
    }
}

export function getRefreshToken(token: string) {
    const stmt = db.prepare('SELECT * FROM RefreshTokens WHERE token = ?');
    const refreshToken = stmt.get(token) as
        | undefined
        | { id: number; user_id: number; token: string; expires_at: string; created_at: string };
    return refreshToken;
}

export function deleteRefreshToken(token: string) {
    const stmt = db.prepare('DELETE FROM RefreshTokens WHERE token = ?');
    stmt.run(token);
}
