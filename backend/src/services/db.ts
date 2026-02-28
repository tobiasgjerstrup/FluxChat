import Database from 'better-sqlite3';

export interface Server {
    id: number;
    owner_id: number;
    name: string;
    icon_url: string | null;
    created_at: string;
}

import { sqliteDBSetup } from '../db/sqlite.js';
import bcrypt from 'bcrypt';
import { HttpError } from '../utils/errors.js';

const db: Database.Database = await sqliteDBSetup();

export async function getMessagesFromChannel(channelId: number) {
    const stmt = db.prepare(`
        SELECT messages.*, Users.username AS author_username
        FROM messages
        JOIN Users ON messages.author_id = Users.id
        WHERE messages.channel_id = ?
        ORDER BY messages.created_at ASC
    `);
    return stmt.all(channelId);
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
    } catch (err) {
        if (err instanceof Database.SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new HttpError('Username or email already exists', 400);
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
    } catch (err) {
        if (err instanceof Database.SqliteError && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new HttpError('Server name already exists', 400);
        }
        throw err;
    }
}

export function getAllServers() {
    return db.prepare('SELECT * FROM Servers ORDER BY created_at ASC').all();
}

export function createChannel({ server_id, name, type }: { server_id: number; name: string; type: string }) {
    const stmt = db.prepare(
        "INSERT INTO Channels (server_id, name, type, created_at) VALUES (?, ?, ?, datetime('now'))",
    );
    const info = stmt.run(server_id, name, type);
    return { id: info.lastInsertRowid, server_id, name, type };
}

export function getChannelsFromServer(serverId: number) {
    const stmt = db.prepare('SELECT * FROM Channels WHERE server_id = ? ORDER BY created_at ASC');
    return stmt.all(serverId);
}

export function storeRefreshToken({ user_id, token }: { user_id: number; token: string }) {
    const stmt = db.prepare(
        "INSERT INTO RefreshTokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))",
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    stmt.run(user_id, token, expiresAt);
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

export function getUsernameById(userId: number) {
    const stmt = db.prepare('SELECT username FROM Users WHERE id = ?');
    const row = stmt.get(userId) as { username: string } | undefined;
    return row ? row.username : null;
}

export function addServerMember({ server_id, user_id }: { server_id: number | bigint; user_id: number }) {
    const stmt = db.prepare("INSERT INTO ServerMembers (server_id, user_id, joined_at) VALUES (?, ?, datetime('now'))");
    stmt.run(server_id, user_id);
}

export function getServerUserIsMemberOf(user_id: number): Server[] {
    const stmt = db.prepare(
        'SELECT * FROM Servers WHERE id IN (SELECT server_id FROM ServerMembers WHERE user_id = ?) ORDER BY created_at ASC',
    );
    return stmt.all(user_id) as Server[];
}

export function createServerInvite({
    server_id,
    creator_id,
    channel_id,
    max_uses,
    expires_at,
    temporary,
}: {
    server_id: number;
    creator_id: number;
    channel_id?: number;
    max_uses?: number;
    expires_at?: string;
    temporary?: boolean;
}) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const stmt = db.prepare(
        "INSERT INTO ServerInvites (code, server_id, channel_id, creator_id, max_uses, expires_at, temporary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    );
    const info = stmt.run(
        code,
        server_id,
        channel_id || null,
        creator_id,
        max_uses || null,
        expires_at || null,
        temporary ? 1 : 0,
    );
    return {
        id: info.lastInsertRowid,
        code,
        server_id,
        channel_id: channel_id || null,
        creator_id,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        temporary: temporary ? 1 : 0,
    };
}

export function getServerInviteByCode(code: string) {
    const stmt = db.prepare('SELECT * FROM ServerInvites WHERE code = ?');
    const invite = stmt.get(code) as
        | undefined
        | {
              id: number;
              code: string;
              server_id: number;
              channel_id: number | null;
              creator_id: number;
              max_uses: number | null;
              uses: number;
              expires_at: string | null;
              temporary: boolean;
              revoked: boolean;
              created_at: string;
          };
    return invite;
}

export function joinServerWithInvite(inviteCode: string, user_id: number) {
    const invite = getServerInviteByCode(inviteCode);
    if (!invite) {
        throw new HttpError('Invalid invite code', 400);
    }
    if (invite.revoked) {
        throw new HttpError('Invite has been revoked', 400);
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new HttpError('Invite has expired', 400);
    }
    if (invite.max_uses && invite.uses >= invite.max_uses) {
        throw new HttpError('Invite has reached its maximum uses', 400);
    }
    if (getServerUserIsMemberOf(user_id).find((s) => s.id === invite.server_id)) {
        throw new HttpError('You are already a member of this server', 400);
    }

    addServerMember({ server_id: invite.server_id, user_id });
    incrementInviteUses(invite.id);
}

export function incrementInviteUses(inviteId: number) {
    const stmt = db.prepare('UPDATE ServerInvites SET uses = uses + 1 WHERE id = ?');
    stmt.run(inviteId);
}

export function getUsers() {
    const stmt = db.prepare('SELECT id, username FROM Users ORDER BY created_at ASC');
    return stmt.all() as { id: number | bigint; username: string }[];
}

// Helper: Find DMChannel by exact participant set
function findDMChannelByParticipants(userIds: number[]): bigint | number | null {
    const sortedUserIds = [...userIds].map(Number).sort((a, b) => a - b);
    const channels = db
        .prepare(
            `
            SELECT dm_channel_id FROM DMParticipants
            WHERE user_id IN (${userIds.map(() => '?').join(',')})
            GROUP BY dm_channel_id
            HAVING COUNT(*) = ?`,
        )
        .all(...userIds, userIds.length) as { dm_channel_id: number | bigint }[];
    for (const row of channels) {
        const participants = db
            .prepare('SELECT user_id FROM DMParticipants WHERE dm_channel_id = ?')
            .all(row.dm_channel_id) as { user_id: number | bigint }[];
        const ids = participants.map((p) => Number(p.user_id)).sort((a, b) => a - b);
        if (ids.length === sortedUserIds.length && ids.every((id, i) => id === sortedUserIds[i])) {
            return row.dm_channel_id;
        }
    }
    return null;
}

export function sendDirectMessage({
    author_id,
    participant_ids,
    content,
}: {
    author_id: number;
    participant_ids: number[];
    content: string;
}) {
    if (participant_ids.length < 2) {
        throw new HttpError('At least 2 participants are required for a DM', 400);
    }

    if (!participant_ids.includes(author_id)) {
        throw new HttpError('Author must be included in participant IDs', 400);
    }

    // Find or create DMChannel
    let dm_channel_id = findDMChannelByParticipants(participant_ids);
    if (!dm_channel_id) {
        const stmt = db.prepare("INSERT INTO DMChannels (is_group, created_at) VALUES (?, datetime('now'))");
        const info = stmt.run(participant_ids.length > 2 ? 1 : 0);
        dm_channel_id = info.lastInsertRowid as number | bigint;
        // Add participants
        const addStmt = db.prepare('INSERT INTO DMParticipants (dm_channel_id, user_id) VALUES (?, ?)');
        for (const user_id of participant_ids) {
            addStmt.run(dm_channel_id, user_id);
        }
    }
    // Insert message
    const msgStmt = db.prepare(
        "INSERT INTO DMMessages (dm_channel_id, author_id, content, created_at) VALUES (?, ?, ?, datetime('now'))",
    );
    const info = msgStmt.run(dm_channel_id, author_id, content);
    return {
        id: info.lastInsertRowid as number | bigint,
        dm_channel_id,
        author_id,
        content,
        created_at: new Date().toISOString(),
    };
}

export function getMessagesForDMChannel(dm_channel_id: number | bigint) {
    const stmt = db.prepare(`
        SELECT m.*, u.username AS author_username
        FROM DMMessages m
        JOIN Users u ON m.author_id = u.id
        WHERE m.dm_channel_id = ?
        ORDER BY m.created_at ASC
    `);
    return stmt.all(dm_channel_id) as {
        id: number | bigint;
        dm_channel_id: number | bigint;
        author_id: number | bigint;
        content: string;
        created_at: string;
        author_username: string;
    }[];
}

export function getParticipantsForDMChannel(dm_channel_id: number | bigint) {
    const stmt = db.prepare(`
        SELECT u.id, u.username
        FROM DMParticipants p
        JOIN Users u ON p.user_id = u.id
        WHERE p.dm_channel_id = ?
        ORDER BY u.username ASC
    `);
    return stmt.all(dm_channel_id) as { id: number | bigint; username: string }[];
}

export function userAdd(user_id: number, friend_id: number) {
    const isSent = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
        .get(user_id, friend_id);
    if (isSent) {
        throw new HttpError('Friend request already sent', 400);
    }
    const isAlreadyFriend = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'accepted'")
        .get(user_id, friend_id);
    if (isAlreadyFriend) {
        throw new HttpError('You are already friends', 400);
    }
    const isBlocked = db
        .prepare(
            "SELECT 1 FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = 'blocked'",
        )
        .get(user_id, friend_id, friend_id, user_id);
    if (isBlocked) {
        throw new HttpError('Cannot send friend request', 400);
    }
    const isReceived = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
        .get(friend_id, user_id);
    if (isReceived) {
        userAccept(friend_id, user_id);
        return;
    }
    const stmt = db.prepare(
        "INSERT INTO friends (user_id, friend_id, status, created_at, updated_at) VALUES (?, ?, 'pending', datetime('now'), datetime('now'))",
    );
    stmt.run(user_id, friend_id);
}

export function userBlock(user_id: number, friend_id: number) {
    const isBlocked = db
        .prepare(
            "SELECT 1 FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = 'blocked'",
        )
        .get(user_id, friend_id, friend_id, user_id);

    if (isBlocked) {
        throw new HttpError('User is already blocked', 400);
    }

    const deleteStmt = db.prepare(
        "DELETE FROM friends WHERE status != 'blocked' AND ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))",
    );
    deleteStmt.run(user_id, friend_id, friend_id, user_id);

    const stmt = db.prepare(
        "INSERT INTO friends (user_id, friend_id, status, created_at, updated_at) VALUES (?, ?, 'blocked', datetime('now'), datetime('now'))",
    );
    stmt.run(user_id, friend_id);
}

export function userAccept(user_id: number, friend_id: number) {
    const isReceived = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
        .get(friend_id, user_id);
    if (!isReceived) {
        throw new HttpError('No friend request to accept', 400);
    }
    const stmt = db.prepare(
        "UPDATE friends SET status = 'accepted', updated_at = datetime('now') WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
    );
    stmt.run(friend_id, user_id);

    const reciprocalStmt = db.prepare(
        "INSERT INTO friends (user_id, friend_id, status, created_at, updated_at) VALUES (?, ?, 'accepted', datetime('now'), datetime('now'))",
    );
    reciprocalStmt.run(user_id, friend_id);
}

export function userReject(user_id: number, friend_id: number) {
    const isReceived = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
        .get(friend_id, user_id);
    if (!isReceived) {
        throw new HttpError('No friend request to reject', 400);
    }
    const stmt = db.prepare("DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'");
    stmt.run(friend_id, user_id);
}

export function userRemove(user_id: number, friend_id: number) {
    const isFriend = db
        .prepare("SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'accepted'")
        .get(user_id, friend_id);
    if (!isFriend) {
        throw new HttpError('You are not friends', 400);
    }
    const stmt = db.prepare(
        'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
    );
    stmt.run(user_id, friend_id, friend_id, user_id);
}
