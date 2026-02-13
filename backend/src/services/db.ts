import Database from "better-sqlite3";

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    db = new Database(process.env.DB_PATH || "./chat.sqlite");
    db.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      userId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run();
  }
  return db;
}

export async function getAllMessages() {
  const db = getDb();
  return db.prepare("SELECT * FROM messages ORDER BY createdAt ASC").all();
}

export function saveMessage({ text, userId }: { text: string; userId?: string }) {
  const db = getDb();
  const stmt = db.prepare("INSERT INTO messages (text, userId) VALUES (?, ?)");
  const info = stmt.run(text, userId || null);
  return { id: info.lastInsertRowid, text, userId, createdAt: new Date().toISOString() };
}
