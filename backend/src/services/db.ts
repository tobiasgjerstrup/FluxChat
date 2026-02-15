import Database from 'better-sqlite3';

import { sqliteDBSetup } from '../db/sqlite.js';
import bcrypt from 'bcrypt';

const db: Database.Database = await sqliteDBSetup();

export async function getAllMessages() {
    return db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
}

export function saveMessage({ content, author_id }: { content: string; author_id?: string }) {
    const stmt = db.prepare('INSERT INTO messages (content, author_id) VALUES (?, ?)');
    const info = stmt.run(content, author_id || null);
    return { id: info.lastInsertRowid, content, author_id, created_at: new Date().toISOString() };
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
