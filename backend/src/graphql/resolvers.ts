import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

let db: Database.Database | null = null;

export function initializeDb(database: Database.Database) {
    db = database;
}

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export const resolvers = {
    DateTime: {
        parseValue(value: unknown) {
            return new Date(value as string);
        },
        serialize(value: Date) {
            return value.toISOString();
        },
    },

    Query: {
        // User queries
        user: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(id) || null;
        },

        me: (_: unknown, __: unknown, { user }: { user?: { id: number } }) => {
            if (!db || !user) throw new Error('Not authenticated');
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(user.id) || null;
        },

        users: () => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Users');
            return stmt.all() || [];
        },

        userByUsername: (_: unknown, { username }: { username: string }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
            return stmt.get(username) || null;
        },

        // Server queries
        server: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(id) || null;
        },

        servers: () => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Servers');
            return stmt.all() || [];
        },

        userServers: (_: unknown, { user_id }: { user_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare(`
                SELECT DISTINCT s.* FROM Servers s
                INNER JOIN ServerMembers sm ON s.id = sm.server_id
                WHERE sm.user_id = ?
            `);
            return stmt.all(user_id) || [];
        },

        // Channel queries
        channel: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Channels WHERE id = ?');
            return stmt.get(id) || null;
        },

        serverChannels: (_: unknown, { server_id }: { server_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Channels WHERE server_id = ?');
            return stmt.all(server_id) || [];
        },

        // Message queries
        message: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Messages WHERE id = ?');
            return stmt.get(id) || null;
        },

        channelMessages: (
            _: unknown,
            { channel_id, limit = 50, offset = 0 }: { channel_id: number; limit?: number; offset?: number },
        ) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare(`
                SELECT * FROM Messages 
                WHERE channel_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `);
            return stmt.all(channel_id, limit, offset) || [];
        },

        // DM queries
        dmChannel: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM DMChannels WHERE id = ?');
            return stmt.get(id) || null;
        },

        userDMChannels: (_: unknown, { user_id }: { user_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare(`
                SELECT DISTINCT dmc.* FROM DMChannels dmc
                INNER JOIN DMParticipants dmp ON dmc.id = dmp.dm_channel_id
                WHERE dmp.user_id = ?
            `);
            return stmt.all(user_id) || [];
        },

        dmMessages: (
            _: unknown,
            { dm_channel_id, limit = 50, offset = 0 }: { dm_channel_id: number; limit?: number; offset?: number },
        ) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare(`
                SELECT * FROM DMMessages 
                WHERE dm_channel_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `);
            return stmt.all(dm_channel_id, limit, offset) || [];
        },

        // Server member queries
        serverMembers: (_: unknown, { server_id }: { server_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM ServerMembers WHERE server_id = ?');
            return stmt.all(server_id) || [];
        },

        serverMember: (_: unknown, { server_id, user_id }: { server_id: number; user_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM ServerMembers WHERE server_id = ? AND user_id = ?');
            return stmt.get(server_id, user_id) || null;
        },

        // Role queries
        serverRoles: (_: unknown, { server_id }: { server_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Roles WHERE server_id = ?');
            return stmt.all(server_id) || [];
        },

        role: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Roles WHERE id = ?');
            return stmt.get(id) || null;
        },

        // Invite queries
        serverInvite: (_: unknown, { code }: { code: string }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM ServerInvites WHERE code = ?');
            return stmt.get(code) || null;
        },

        serverInvites: (_: unknown, { server_id }: { server_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM ServerInvites WHERE server_id = ?');
            return stmt.all(server_id) || [];
        },

        // Notification queries
        userNotifications: (_: unknown, { user_id }: { user_id: number }) => {
            if (!db) throw new Error('Database not initialized');
            const stmt = db.prepare('SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC');
            return stmt.all(user_id) || [];
        },
    },

    Mutation: {
        // User mutations
        register: async (
            _: unknown,
            { username, email, password }: { username: string; email: string; password: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();

            const insertStmt = db.prepare(`
                INSERT INTO Users (username, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
            `);

            const result = insertStmt.run(username, email, hashedPassword, now);
            const user = db.prepare('SELECT * FROM Users WHERE id = ?').get(result.lastInsertRowid) as
                | Record<string, unknown>
                | undefined;
            if (!user) throw new Error('Failed to create user');

            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            const refresh_token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });

            return { token, refresh_token, user };
        },

        login: async (_: unknown, { email, password }: { email: string; password: string }) => {
            if (!db) throw new Error('Database not initialized');

            const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email) as
                | Record<string, unknown>
                | undefined;
            if (!user) throw new Error('User not found');

            const validPassword = await bcrypt.compare(password, user.password_hash as string);
            if (!validPassword) throw new Error('Invalid password');

            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            const refresh_token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '7d' });

            return { token, refresh_token, user };
        },

        updateUser: (
            _: unknown,
            { id, username, avatar_url }: { id: number; username?: string; avatar_url?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const updates = [];
            const values = [];

            if (username !== undefined) {
                updates.push('username = ?');
                values.push(username);
            }
            if (avatar_url !== undefined) {
                updates.push('avatar_url = ?');
                values.push(avatar_url);
            }

            if (updates.length === 0) {
                return db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
            }

            values.push(id);
            const stmt = db.prepare(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`);
            stmt.run(...values);

            return db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
        },

        updateUserStatus: (
            _: unknown,
            { user_id, status, custom_status }: { user_id: number; status: string; custom_status?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO UserStatus (user_id, status, custom_status, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE 
                SET status = ?, custom_status = ?, updated_at = ?
            `);

            stmt.run(user_id, status, custom_status, now, status, custom_status, now);
            return db.prepare('SELECT * FROM UserStatus WHERE user_id = ?').get(user_id);
        },

        // Server mutations
        createServer: (
            _: unknown,
            { name, icon_url }: { name: string; icon_url?: string },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO Servers (owner_id, name, icon_url, created_at)
                VALUES (?, ?, ?, ?)
            `);

            const result = stmt.run(user.id, name, icon_url || null, now);

            // Add creator as server member
            const memberStmt = db.prepare(`
                INSERT INTO ServerMembers (server_id, user_id, joined_at)
                VALUES (?, ?, ?)
            `);
            memberStmt.run(result.lastInsertRowid, user.id, now);

            return db.prepare('SELECT * FROM Servers WHERE id = ?').get(result.lastInsertRowid);
        },

        updateServer: (_: unknown, { id, name, icon_url }: { id: number; name?: string; icon_url?: string }) => {
            if (!db) throw new Error('Database not initialized');

            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }
            if (icon_url !== undefined) {
                updates.push('icon_url = ?');
                values.push(icon_url);
            }

            if (updates.length === 0) {
                return db.prepare('SELECT * FROM Servers WHERE id = ?').get(id);
            }

            values.push(id);
            const stmt = db.prepare(`UPDATE Servers SET ${updates.join(', ')} WHERE id = ?`);
            stmt.run(...values);

            return db.prepare('SELECT * FROM Servers WHERE id = ?').get(id);
        },

        deleteServer: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM Servers WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        // Channel mutations
        createChannel: (
            _: unknown,
            { server_id, name, type, topic }: { server_id: number; name: string; type?: string; topic?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO Channels (server_id, name, type, topic, created_at)
                VALUES (?, ?, ?, ?, ?)
            `);

            const result = stmt.run(server_id, name, type || 'text', topic || null, now);
            return db.prepare('SELECT * FROM Channels WHERE id = ?').get(result.lastInsertRowid);
        },

        updateChannel: (_: unknown, { id, name, topic }: { id: number; name?: string; topic?: string }) => {
            if (!db) throw new Error('Database not initialized');

            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }
            if (topic !== undefined) {
                updates.push('topic = ?');
                values.push(topic);
            }

            if (updates.length === 0) {
                return db.prepare('SELECT * FROM Channels WHERE id = ?').get(id);
            }

            values.push(id);
            const stmt = db.prepare(`UPDATE Channels SET ${updates.join(', ')} WHERE id = ?`);
            stmt.run(...values);

            return db.prepare('SELECT * FROM Channels WHERE id = ?').get(id);
        },

        deleteChannel: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM Channels WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        // Message mutations
        createMessage: (
            _: unknown,
            { channel_id, content, reply_to_id }: { channel_id: number; content: string; reply_to_id?: number },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO Messages (channel_id, author_id, content, created_at, reply_to_id)
                VALUES (?, ?, ?, ?, ?)
            `);

            const result = stmt.run(channel_id, user.id, content, now, reply_to_id || null);
            return db.prepare('SELECT * FROM Messages WHERE id = ?').get(result.lastInsertRowid);
        },

        editMessage: (_: unknown, { id, content }: { id: number; content: string }) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare('UPDATE Messages SET content = ?, edited_at = ? WHERE id = ?');
            stmt.run(content, now, id);

            return db.prepare('SELECT * FROM Messages WHERE id = ?').get(id);
        },

        deleteMessage: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM Messages WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        addMessageReaction: (
            _: unknown,
            { message_id, emoji }: { message_id: number; emoji: string },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const stmt = db.prepare(`
                INSERT INTO MessageReactions (message_id, user_id, emoji)
                VALUES (?, ?, ?)
            `);

            const result = stmt.run(message_id, user.id, emoji);
            return db.prepare('SELECT * FROM MessageReactions WHERE id = ?').get(result.lastInsertRowid);
        },

        removeMessageReaction: (
            _: unknown,
            { message_id, emoji }: { message_id: number; emoji: string },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            try {
                const stmt = db.prepare(
                    'DELETE FROM MessageReactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
                );
                stmt.run(message_id, user.id, emoji);
                return true;
            } catch {
                return false;
            }
        },

        // DM mutations
        createDMChannel: (
            _: unknown,
            { user_ids, is_group }: { user_ids: number[]; is_group?: boolean },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO DMChannels (is_group, created_at)
                VALUES (?, ?)
            `);

            const result = stmt.run(is_group || false, now);
            const dmChannelId = result.lastInsertRowid;

            // Add all participants
            const participantStmt = db.prepare(`
                INSERT INTO DMParticipants (dm_channel_id, user_id)
                VALUES (?, ?)
            `);

            for (const userId of user_ids) {
                participantStmt.run(dmChannelId, userId);
            }

            // Add current user if not already included
            if (!user_ids.includes(user.id)) {
                participantStmt.run(dmChannelId, user.id);
            }

            return db.prepare('SELECT * FROM DMChannels WHERE id = ?').get(dmChannelId);
        },

        sendDMMessage: (
            _: unknown,
            { dm_channel_id, content }: { dm_channel_id: number; content: string },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO DMMessages (dm_channel_id, author_id, content, created_at)
                VALUES (?, ?, ?, ?)
            `);

            const result = stmt.run(dm_channel_id, user.id, content, now);
            return db.prepare('SELECT * FROM DMMessages WHERE id = ?').get(result.lastInsertRowid);
        },

        editDMMessage: (_: unknown, { id, content }: { id: number; content: string }) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare('UPDATE DMMessages SET content = ?, edited_at = ? WHERE id = ?');
            stmt.run(content, now, id);

            return db.prepare('SELECT * FROM DMMessages WHERE id = ?').get(id);
        },

        deleteDMMessage: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM DMMessages WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        // Server member mutations
        addServerMember: (_: unknown, { server_id, user_id }: { server_id: number; user_id: number }) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO ServerMembers (server_id, user_id, joined_at)
                VALUES (?, ?, ?)
            `);

            const result = stmt.run(server_id, user_id, now);
            return db.prepare('SELECT * FROM ServerMembers WHERE id = ?').get(result.lastInsertRowid);
        },

        removeServerMember: (_: unknown, { server_id, user_id }: { server_id: number; user_id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM ServerMembers WHERE server_id = ? AND user_id = ?');
                stmt.run(server_id, user_id);
                return true;
            } catch {
                return false;
            }
        },

        updateServerMemberNickname: (
            _: unknown,
            { server_id, user_id, nickname }: { server_id: number; user_id: number; nickname?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const stmt = db.prepare('UPDATE ServerMembers SET nickname = ? WHERE server_id = ? AND user_id = ?');
            stmt.run(nickname || null, server_id, user_id);

            return db
                .prepare('SELECT * FROM ServerMembers WHERE server_id = ? AND user_id = ?')
                .get(server_id, user_id);
        },

        // Role mutations
        createRole: (
            _: unknown,
            {
                server_id,
                name,
                color,
                position,
                permissions,
            }: { server_id: number; name: string; color?: string; position?: number; permissions?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const stmt = db.prepare(`
                INSERT INTO Roles (server_id, name, color, position, permissions)
                VALUES (?, ?, ?, ?, ?)
            `);

            const result = stmt.run(server_id, name, color || null, position || 0, permissions || null);
            return db.prepare('SELECT * FROM Roles WHERE id = ?').get(result.lastInsertRowid);
        },

        updateRole: (
            _: unknown,
            { id, name, color, permissions }: { id: number; name?: string; color?: string; permissions?: string },
        ) => {
            if (!db) throw new Error('Database not initialized');

            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }
            if (color !== undefined) {
                updates.push('color = ?');
                values.push(color);
            }
            if (permissions !== undefined) {
                updates.push('permissions = ?');
                values.push(permissions);
            }

            if (updates.length === 0) {
                return db.prepare('SELECT * FROM Roles WHERE id = ?').get(id);
            }

            values.push(id);
            const stmt = db.prepare(`UPDATE Roles SET ${updates.join(', ')} WHERE id = ?`);
            stmt.run(...values);

            return db.prepare('SELECT * FROM Roles WHERE id = ?').get(id);
        },

        deleteRole: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM Roles WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        assignRoleToMember: (_: unknown, { member_id, role_id }: { member_id: number; role_id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare(`
                    INSERT INTO MemberRoles (member_id, role_id)
                    VALUES (?, ?)
                `);
                stmt.run(member_id, role_id);
                return true;
            } catch {
                return false;
            }
        },

        removeRoleFromMember: (_: unknown, { member_id, role_id }: { member_id: number; role_id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('DELETE FROM MemberRoles WHERE member_id = ? AND role_id = ?');
                stmt.run(member_id, role_id);
                return true;
            } catch {
                return false;
            }
        },

        // Invite mutations
        createServerInvite: (
            _: unknown,
            {
                server_id,
                max_uses,
                expires_at,
                temporary,
            }: { server_id: number; max_uses?: number; expires_at?: string; temporary?: boolean },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const code = Math.random().toString(36).substring(2, 10);

            const stmt = db.prepare(`
                INSERT INTO ServerInvites (code, server_id, creator_id, max_uses, expires_at, temporary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                code,
                server_id,
                user.id,
                max_uses || null,
                expires_at || null,
                temporary ? 1 : 0,
                now,
            );
            return db.prepare('SELECT * FROM ServerInvites WHERE id = ?').get(result.lastInsertRowid);
        },

        revokeServerInvite: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            try {
                const stmt = db.prepare('UPDATE ServerInvites SET revoked = 1 WHERE id = ?');
                stmt.run(id);
                return true;
            } catch {
                return false;
            }
        },

        useServerInvite: (_: unknown, { code }: { code: string }, { user }: { user?: { id: number } }) => {
            if (!db || !user) throw new Error('Not authenticated');

            const invite = db.prepare('SELECT * FROM ServerInvites WHERE code = ?').get(code) as
                | Record<string, unknown>
                | undefined;
            if (!invite) throw new Error('Invite not found');
            if (invite.revoked) throw new Error('Invite has been revoked');

            // Check max uses
            if (invite.max_uses && (invite.uses as number) >= (invite.max_uses as number)) {
                throw new Error('Invite has reached max uses');
            }

            // Check expiry
            if (invite.expires_at && new Date(invite.expires_at as string) < new Date()) {
                throw new Error('Invite has expired');
            }

            // Add user to server
            const now = new Date().toISOString();
            const memberStmt = db.prepare(`
                INSERT INTO ServerMembers (server_id, user_id, joined_at)
                VALUES (?, ?, ?)
            `);
            const result = memberStmt.run(invite.server_id, user.id, now);

            // Increment uses
            const updateStmt = db.prepare('UPDATE ServerInvites SET uses = uses + 1 WHERE id = ?');
            updateStmt.run(invite.id as number);

            return db.prepare('SELECT * FROM ServerMembers WHERE id = ?').get(result.lastInsertRowid);
        },

        // Ban mutations
        banServerMember: (
            _: unknown,
            {
                server_id,
                user_id,
                reason,
                expires_at,
            }: { server_id: number; user_id: number; reason?: string; expires_at?: string },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            const now = new Date().toISOString();
            const stmt = db.prepare(`
                INSERT INTO ServerBans (server_id, user_id, banned_by_id, reason, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(server_id, user_id, user.id, reason || null, now, expires_at || null);
            return db.prepare('SELECT * FROM ServerBans WHERE id = ?').get(result.lastInsertRowid);
        },

        unbanServerMember: (
            _: unknown,
            { server_id, user_id }: { server_id: number; user_id: number },
            { user }: { user?: { id: number } },
        ) => {
            if (!db || !user) throw new Error('Not authenticated');

            try {
                const now = new Date().toISOString();
                const stmt = db.prepare(`
                    UPDATE ServerBans 
                    SET unbanned_by_id = ?, unbanned_at = ? 
                    WHERE server_id = ? AND user_id = ? AND unbanned_at IS NULL
                `);
                stmt.run(user.id, now, server_id, user_id);
                return true;
            } catch {
                return false;
            }
        },

        // Notification mutations
        markNotificationAsRead: (_: unknown, { id }: { id: number }) => {
            if (!db) throw new Error('Database not initialized');

            const now = new Date().toISOString();
            const stmt = db.prepare('UPDATE Notifications SET read_at = ? WHERE id = ?');
            stmt.run(now, id);

            return db.prepare('SELECT * FROM Notifications WHERE id = ?').get(id);
        },
    },

    // Field resolvers
    User: {
        status: (user: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM UserStatus WHERE user_id = ?');
            return stmt.get(user.id) || null;
        },
        servers: (user: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare(`
                SELECT DISTINCT s.* FROM Servers s
                INNER JOIN ServerMembers sm ON s.id = sm.server_id
                WHERE sm.user_id = ?
            `);
            return stmt.all(user.id) || [];
        },
        direct_messages: (user: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare(`
                SELECT DISTINCT dmc.* FROM DMChannels dmc
                INNER JOIN DMParticipants dmp ON dmc.id = dmp.dm_channel_id
                WHERE dmp.user_id = ?
            `);
            return stmt.all(user.id) || [];
        },
    },

    Server: {
        owner: (server: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(server.owner_id) || null;
        },
        members: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM ServerMembers WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
        channels: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM Channels WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
        roles: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM Roles WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
        invites: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM ServerInvites WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
        bans: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM ServerBans WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
        audit_logs: (server: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM AuditLogs WHERE server_id = ?');
            return stmt.all(server.id) || [];
        },
    },

    ServerMember: {
        user: (member: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(member.user_id) || null;
        },
        server: (member: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(member.server_id) || null;
        },
        roles: (member: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare(`
                SELECT r.* FROM Roles r
                INNER JOIN MemberRoles mr ON r.id = mr.role_id
                WHERE mr.member_id = ?
            `);
            return stmt.all(member.id) || [];
        },
    },

    Role: {
        server: (role: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(role.server_id) || null;
        },
    },

    Channel: {
        server: (channel: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(channel.server_id) || null;
        },
        messages: (channel: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM Messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT 50');
            return stmt.all(channel.id) || [];
        },
        permissions: (channel: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM ChannelPermissions WHERE channel_id = ?');
            return stmt.all(channel.id) || [];
        },
    },

    ChannelPermission: {
        channel: (permission: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Channels WHERE id = ?');
            return stmt.get(permission.channel_id) || null;
        },
    },

    Message: {
        channel: (message: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Channels WHERE id = ?');
            return stmt.get(message.channel_id) || null;
        },
        author: (message: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(message.author_id) || null;
        },
        reply_to: (message: Record<string, unknown>) => {
            if (!db || !message.reply_to_id) return null;
            const stmt = db.prepare('SELECT * FROM Messages WHERE id = ?');
            return stmt.get(message.reply_to_id) || null;
        },
        attachments: (message: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM MessageAttachments WHERE message_id = ?');
            return stmt.all(message.id) || [];
        },
        reactions: (message: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare('SELECT * FROM MessageReactions WHERE message_id = ?');
            return stmt.all(message.id) || [];
        },
    },

    MessageAttachment: {
        message: (attachment: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Messages WHERE id = ?');
            return stmt.get(attachment.message_id) || null;
        },
    },

    MessageReaction: {
        user: (reaction: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(reaction.user_id) || null;
        },
        message: (reaction: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Messages WHERE id = ?');
            return stmt.get(reaction.message_id) || null;
        },
    },

    DMChannel: {
        participants: (dmChannel: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare(`
                SELECT u.* FROM Users u
                INNER JOIN DMParticipants dmp ON u.id = dmp.user_id
                WHERE dmp.dm_channel_id = ?
            `);
            return stmt.all(dmChannel.id) || [];
        },
        messages: (dmChannel: Record<string, unknown>) => {
            if (!db) return [];
            const stmt = db.prepare(
                'SELECT * FROM DMMessages WHERE dm_channel_id = ? ORDER BY created_at DESC LIMIT 50',
            );
            return stmt.all(dmChannel.id) || [];
        },
    },

    DMMessage: {
        dm_channel: (message: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM DMChannels WHERE id = ?');
            return stmt.get(message.dm_channel_id) || null;
        },
        author: (message: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(message.author_id) || null;
        },
    },

    ServerBan: {
        server: (ban: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(ban.server_id) || null;
        },
        user: (ban: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(ban.user_id) || null;
        },
        banned_by: (ban: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(ban.banned_by_id) || null;
        },
        unbanned_by: (ban: Record<string, unknown>) => {
            if (!db || !ban.unbanned_by_id) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(ban.unbanned_by_id) || null;
        },
    },

    AuditLog: {
        server: (log: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(log.server_id) || null;
        },
        actor: (log: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(log.actor_id) || null;
        },
    },

    ServerInvite: {
        server: (invite: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Servers WHERE id = ?');
            return stmt.get(invite.server_id) || null;
        },
        creator: (invite: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(invite.creator_id) || null;
        },
    },

    Notification: {
        user: (notification: Record<string, unknown>) => {
            if (!db) return null;
            const stmt = db.prepare('SELECT * FROM Users WHERE id = ?');
            return stmt.get(notification.user_id) || null;
        },
    },
};
