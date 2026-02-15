import Database from 'better-sqlite3';
import { sqliteDBSetup } from '../db/sqlite.js';

const db: Database.Database = await sqliteDBSetup();

export async function getAllMessages() {
    return db.prepare('SELECT * FROM messages ORDER BY createdAt ASC').all();
}

export function saveMessage({ text, userId }: { text: string; userId?: string }) {
    const stmt = db.prepare('INSERT INTO messages (text, userId) VALUES (?, ?)');
    const info = stmt.run(text, userId || null);
    return { id: info.lastInsertRowid, text, userId, createdAt: new Date().toISOString() };
}
